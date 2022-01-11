import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { NavBar } from "../components/NavBar";
import { useMeQuery } from "../generated/graphql";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  return <div className="">hi</div>;
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
