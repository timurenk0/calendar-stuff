import { IAuthToken } from "@lib/interfaces";

export default async function apiFetch(url: string, token: IAuthToken) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...token
            }
        });

        if (!response.ok) throw new Error(`Fetch request failed. Status code: ${response.status}`);

        const data = await response.json();
        return data;       
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        throw new Error(`Failed to send GET request: ${msg}`);
    }
}