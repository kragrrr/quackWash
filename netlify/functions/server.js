import serverless from "serverless-http";
import { appHandler } from "../../app.js";

// Wrap the native HTTP Server appHandler in Netlify-compatible format
export const handler = serverless(appHandler);
