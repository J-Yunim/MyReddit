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

const Index = () => {
  return (
    <Stack spacing={8}>
      <Flex key="1" p={5} shadow="md" borderWidth="1px">
        <Box flex={1}>
          <NextLink href="/post/[id]" as={`/post/1`}>
            <Link>
              <Heading fontSize="xl">1eeee</Heading>
            </Link>
          </NextLink>
          <Text>posted by eeeee</Text>
          <Flex align="center">
            <Text flex={1} mt={4}>
              dddddddddd
            </Text>
            <Box ml="auto"></Box>
          </Flex>
        </Box>
      </Flex>
    </Stack>
  );
};

export default Index;
