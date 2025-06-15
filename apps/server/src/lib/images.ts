import Cloudflare from "cloudflare";

export async function uploadImage(
	file: File,
	apiToken: string,
	accountId: string,
) {
	const client = new Cloudflare({
		apiToken,
	});

	const response = await client.images.v1.create({
		account_id: accountId,
		file: file,
	});

	if (!response.id) {
		throw new Error("Failed to upload image");
	}

	return response;
}

export async function deleteImage(
	apiToken: string,
	accountId: string,
	imageId: string,
) {
	const client = new Cloudflare({
		apiToken,
	});

	const response = await client.images.v1.delete(imageId, {
		account_id: accountId,
	});

	return response;
}
