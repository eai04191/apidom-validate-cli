# apidom-validate-cli

A CLI that validates OpenAPI / AsyncAPI files and prints the **same diagnostics you see in [editor.swagger.io](https://editor.swagger.io/)**, powered by the [ApiDOM Language Service](https://www.npmjs.com/package/@swagger-api/apidom-ls).

Use it locally or in CI to catch issues before push, with error messages and codes matching the official Swagger Editor.

## Usage

```bash
npx apidom-validate-cli <file>
```

## Example

```bash
npx apidom-validate-cli ./openapi.yaml
```

Output:

```
/openapi.yaml
  11:21  error  should be equal to one of the allowed values allowedValues: boolean, object, array, number, string, integer, null  10001
  161:11  warning  property "example" is deprecated, use "examples" instead  10069

✖ 2 problems (1 error, 1 warning)
```

Exit code is `0` when no errors are found, `1` otherwise.

## Credits

Heavily inspired by the [swaggerexpert/apidom-validate](https://github.com/swaggerexpert/apidom-validate) GitHub Action — this package fills the gap of running the same validation locally or in non-Action CI.
