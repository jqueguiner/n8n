import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api.gladia.io';

export async function gladiaApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: object = {},
	headers: Record<string, string> = {},
): Promise<JsonObject> {
	const options: IRequestOptions = {
		method,
		uri: `${BASE_URL}${endpoint}`,
		body,
		json: true,
		headers,
	};

	if (method === 'GET' || Object.keys(body).length === 0) {
		delete options.body;
	}

	const response = await this.helpers.requestWithAuthentication.call(this, 'gladiaApi', options);

	if (typeof response === 'string') {
		try {
			return JSON.parse(response) as JsonObject;
		} catch {
			throw new NodeApiError(this.getNode(), { message: `Unexpected response: ${response}` });
		}
	}

	return response as JsonObject;
}

export async function gladiaApiUpload(
	this: IExecuteFunctions,
	buffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<JsonObject> {
	const credentials = await this.getCredentials('gladiaApi');

	const formData = {
		audio: {
			value: buffer,
			options: {
				filename: fileName,
				contentType: mimeType,
			},
		},
	};

	const options: IRequestOptions = {
		method: 'POST',
		uri: `${BASE_URL}/v2/upload`,
		formData,
		json: true,
		headers: {
			'x-gladia-key': credentials.apiKey as string,
		},
	};

	const response = await this.helpers.request(options);

	if (typeof response === 'string') {
		try {
			return JSON.parse(response) as JsonObject;
		} catch {
			throw new NodeApiError(this.getNode(), { message: `Upload failed: ${response}` });
		}
	}

	return response as JsonObject;
}
