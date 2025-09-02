import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Schema: names → email(s)
const schema = {
    type: "object",
    additionalProperties: {
        oneOf: [
            { type: "string", format: "email" },
            {
                type: "array",
                items: { type: "string", format: "email" },
            },
        ],
    },
};

const validate = ajv.compile(schema);

export function validate_config_file(data: unknown) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
}
