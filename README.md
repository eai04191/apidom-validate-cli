# apidom-validate-cli

CLI validator for ApiDOM files using the [ApiDOM Language Service](https://www.npmjs.com/package/@swagger-api/apidom-ls).

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
  11:21  error  type must be one of allowed values  10001
  161:11  warning  property "example" is deprecated, use "examples" instead  10069

✖ 2 problems (1 errors, 1 warnings)
```

## Credits

This CLI tool was heavily inspired by the [swaggerexpert/apidom-validate](https://github.com/swaggerexpert/apidom-validate) GitHub Action, especially the implementation patterns for using the ApiDOM Language Service.
