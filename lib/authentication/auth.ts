import { IAuthToken } from "../interfaces";


export class AuthManager {
    private API_KEY: string;
    
    constructor(API_KEY: string) {
        this.API_KEY = API_KEY;
    }

    
    /**
     * Returns the authentication header object containing the API token.
     * Useful for attaching the token to HTTP requests.
     * @returns authentication header object
     */
    getAuthHeader(): IAuthToken {
        try {
            const token = { "Teamup-Token": this.API_KEY };
            return token;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to get authentication header: ${msg}`);
        }
    }

    /**
     * Authenticates user using API key
     * @param api_key TeamUp access token
     * @returns User information object
     */
    async authenticate() {
        try {
            const response = await fetch("https://api.teamup.com/check-access",{
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Teamup-Token": this.API_KEY
                }
            });

            if (!response.ok) throw new Error(`Failed to send API request. Server responded with code: ${response.status}`)
            
            return response;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unkown Error";
             throw new Error(`Failed to authenticate user. Error message: ${msg}`);
        }
    }
}