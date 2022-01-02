import {
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import React, { InputHTMLAttributes } from "react";
import { Field } from "formik";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  type?: string;
};
const InputField: React.FC<InputFieldProps> = (props) => {
  return (
    <Field name={props.name}>
      {({ field, form, meta }) => (
        <FormControl isInvalid={meta.error && meta.touched}>
          <FormLabel htmlFor={props.name}>{props.label}</FormLabel>
          <Input
            {...field}
            {...props}
            id={props.name}
            placeholder={props.placeholder}
          />
          {meta.touched && meta.error && (
            <FormErrorMessage>{meta.error}</FormErrorMessage>
          )}
        </FormControl>
      )}
    </Field>
  );
};
export default InputField;
