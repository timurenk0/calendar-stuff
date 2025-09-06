import { useState } from "react";
import { IoClose } from "react-icons/io5";


const LoginForm = ( { onClose }: { onClose: (param: boolean) => void } ) => {
    const [apiKey, setApiKey] = useState<string>("");
    const [isLogging, setIsLogging] = useState<boolean>(false);

    async function handleLogin(api_key: string): Promise<void> {
        console.log("Handling login...");
        try {
            setIsLogging(true);
            const response = await fetch("http://localhost:3999/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ api_key }),
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to send request to API endpoint");

            
            alert("Logged in successfully");
            onClose(false);
            location.reload();
            return;
        } catch (e) {
            alert(e);
            return;
        } finally {
            setIsLogging(false);
        }
    }
    
  return (
    <div className="w-screen h-screen bg-[#0000003e] absolute top-0 left-0 flex items-center justify-center">
        <div className="w-[400px] bg-white rounded-xl px-5 text-black py-5 pt-7 relative">
            <button className="absolute rounded-lg top-0 right-0 p-2 m-1 cursor-pointer hover:bg-gray-200" onClick={() => onClose(false)}>
                <IoClose />
            </button>
            <label htmlFor="api_input">Paste your API key below:</label>
            <input id="api_input" type="text" className="bg-gray-200 rounded-lg w-full h-8 mt-2 px-2 hover:border-b-1 border-gray-400" onInput={(e) => setApiKey((e.target as HTMLInputElement).value)} />
            <button type="submit" onClick={() => handleLogin(apiKey)} className={`mt-5 ${isLogging ? "bg-green-200" : "bg-green-300"} w-full py-2 rounded-xl cursor-pointer hover:bg-green-400`}>{isLogging ? "Submitting..." : "Submit"}</button>
        </div>
    </div>
  )
}

export default LoginForm;