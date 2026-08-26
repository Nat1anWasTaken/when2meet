import { handleMcpRequest } from "$lib/server/mcp";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = ({ request }) => handleMcpRequest(request);
