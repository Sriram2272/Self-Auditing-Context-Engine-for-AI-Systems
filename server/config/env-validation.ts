/**
 * Environment variable validation
 * Checks required environment variables on server startup
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical environment variables
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    errors.push("AI_INTEGRATIONS_OPENAI_API_KEY is required but not set");
  }

  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    errors.push("AI_INTEGRATIONS_OPENAI_BASE_URL is required but not set");
  }

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required but not set");
  }

  // Check Firebase service account (warning only for development)
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    if (process.env.NODE_ENV === "production") {
      errors.push(
        "FIREBASE_SERVICE_ACCOUNT is required in production but not set. " +
        "Set this to your Firebase service account JSON string."
      );
    } else {
      warnings.push(
        "FIREBASE_SERVICE_ACCOUNT not set. Using application default credentials. " +
        "For production, set this to your Firebase service account JSON string."
      );
    }
  }

  // Validate Firebase service account format if provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        errors.push(
          "FIREBASE_SERVICE_ACCOUNT is invalid. It must contain project_id, private_key, and client_email fields."
        );
      }
    } catch (parseError) {
      errors.push(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON. It should be a JSON string containing your Firebase service account."
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates environment variables and throws if critical variables are missing
 * Logs warnings for non-critical issues
 */
export function ensureValidEnvironment(): void {
  const result = validateEnvironmentVariables();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Environment Warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn("");
  }

  // Throw on errors
  if (!result.valid) {
    console.error("\n❌ Environment Validation Failed:");
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    console.error("");
    throw new Error(
      "Missing required environment variables. Please check your configuration."
    );
  }

  console.log("✅ Environment validation passed");
}
