import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { getConnection } from "typeorm";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field({ nullable: true })
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: [FieldError];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length < 3) {
      return {
        errors: [
          { field: "newPassword", message: "length must be greater than 2" },
        ],
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userid = await redis.get(key);
    if (!userid) {
      return {
        errors: [{ field: "token", message: "invalid token" }],
      };
    }

    const userIdNum = parseInt(userid);
    const user = await User.findOne(userIdNum);
    if (!user) {
      return {
        // user no longer exists
        errors: [{ field: "token", message: "invalid token" }],
      };
    }

    User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // the email is not in the db
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          { field: "username", message: "length must be greater than 2" },
        ],
      };
    }
    if (options.password.length <= 3) {
      return {
        errors: [
          { field: "password", message: "length must be greater than 3" },
        ],
      };
    }
    if (!options.email || !options.email.includes("@")) {
      return {
        errors: [{ field: "email", message: "invalid email" }],
      };
    }
    const hashedpassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values([
          {
            username: options.username,
            password: hashedpassword,
            email: options.email,
          },
        ])
        .execute();
      user = result.raw[0];
    } catch (err) {
      // duplicate name error
      if (err.code == "23505") {
        return {
          errors: [{ field: "username", message: "username already exists" }],
        };
      }
    }
    req.session!.userId = user?.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { username: options.username } });
    if (!user) {
      return {
        errors: [{ field: "username", message: "username doesn't exist" }],
      };
    }
    const verify = await argon2.verify(user.password, options.password);
    if (verify) {
      req.session.userId = user.id;

      return {
        user,
      };
    } else {
      return {
        errors: [
          { field: "password", message: "Incorrect password or username" },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
