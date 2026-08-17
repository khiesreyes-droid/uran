import z from 'zod';

import packageJSON from './package.json';

// Single unified environment schema
const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']),
  EXPO_PUBLIC_NAME: z.string(),
  EXPO_PUBLIC_SCHEME: z.string(),
  EXPO_PUBLIC_BUNDLE_ID: z.string(),
  EXPO_PUBLIC_PACKAGE: z.string(),
  EXPO_PUBLIC_VERSION: z.string(),
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_ASSOCIATED_DOMAIN: z.string().url().optional(),
  EXPO_PUBLIC_VAR_NUMBER: z.number(),
  EXPO_PUBLIC_VAR_BOOL: z.boolean(),

  // Firebase Realtime Database URL
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: z.string().optional(),

  // Device coordinates for weather forecasts (defaults to Manila, PH)
  EXPO_PUBLIC_WEATHER_LAT: z.number(),
  EXPO_PUBLIC_WEATHER_LNG: z.number(),

  // Tomorrow.io API key — https://app.tomorrow.io/development/keys
  EXPO_PUBLIC_TOMORROW_API_KEY: z.string().optional(),

  // only available for app.config.ts usage
  APP_BUILD_ONLY_VAR: z.string().optional(),
});

// Config records per environment
const EXPO_PUBLIC_APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV
  ?? 'development') as z.infer<typeof envSchema>['EXPO_PUBLIC_APP_ENV'];

const BUNDLE_IDS = {
  development: 'com.uran.development',
  preview: 'com.uran.preview',
  production: 'com.uran',
} as const;

const PACKAGES = {
  development: 'com.uran.development',
  preview: 'com.uran.preview',
  production: 'com.uran',
} as const;

const SCHEMES = {
  development: 'uran',
  preview: 'uran.preview',
  production: 'uran',
} as const;

const NAME = 'uran';

// Check if strict validation is required (before prebuild)
const STRICT_ENV_VALIDATION = process.env.STRICT_ENV_VALIDATION === '1';

// Build env object
const _env: z.infer<typeof envSchema> = {
  EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_NAME: NAME,
  EXPO_PUBLIC_SCHEME: SCHEMES[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_BUNDLE_ID: BUNDLE_IDS[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_PACKAGE: PACKAGES[EXPO_PUBLIC_APP_ENV],
  EXPO_PUBLIC_VERSION: packageJSON.version,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? '',
  EXPO_PUBLIC_ASSOCIATED_DOMAIN: process.env.EXPO_PUBLIC_ASSOCIATED_DOMAIN,
  EXPO_PUBLIC_VAR_NUMBER: Number(process.env.EXPO_PUBLIC_VAR_NUMBER ?? 0),
  EXPO_PUBLIC_VAR_BOOL: process.env.EXPO_PUBLIC_VAR_BOOL === 'true',
  EXPO_PUBLIC_WEATHER_LAT: Number(process.env.EXPO_PUBLIC_WEATHER_LAT ?? 14.5995),
  EXPO_PUBLIC_WEATHER_LNG: Number(process.env.EXPO_PUBLIC_WEATHER_LNG ?? 120.9842),
  APP_BUILD_ONLY_VAR: process.env.APP_BUILD_ONLY_VAR,
};

function getValidatedEnv(env: z.infer<typeof envSchema>) {
  const parsed = envSchema.safeParse(env);

  if (parsed.success === false) {
    const errorMessage
      = `❌ Invalid environment variables:${
        JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
      }\n❌ Missing variables in .env file for APP_ENV=${EXPO_PUBLIC_APP_ENV}`
      + `\n💡 Tip: If you recently updated the .env file, try restarting with -c flag to clear the cache.`;

    if (STRICT_ENV_VALIDATION) {
      console.error(errorMessage);
      throw new Error('Invalid environment variables');
    }
  }
  else {
    console.log('✅ Environment variables validated successfully');
  }

  return parsed.success ? parsed.data : env;
}

const Env = STRICT_ENV_VALIDATION ? getValidatedEnv(_env) : _env;

export default Env;
