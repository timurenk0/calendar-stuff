import { MdAccountCircle } from "react-icons/md";
import { IoCalendarSharp } from "react-icons/io5";
import LoginForm from "./auth/LoginForm";
import { useState } from "react";
import { useAuth } from "../utils/auth-middleware";

const Header = () => {
    const [showLoginForm, setShowLoginForm] = useState<boolean>(false);

    const { isAuthenticated, loading } = useAuth();

    if (loading) return (<p>Loading</p>);

    
  return (
    <header className="w-screen h-20 bg-black text-white px-10 py-2">
        <div className="h-full flex items-center justify-between">
            <a className="flex items-center" href="/">
                <IoCalendarSharp size={28} />
                <h1 className="tracking-[0.5rem] ms-2">teamup-lib</h1>
            </a>
            {isAuthenticated ? (
                <div>
                    <a className="underline mx-2" href="/calendar">Calendar</a>
                    <a className="underline mx-2" href="/comparator">Arranger</a>
                </div>
            ): (
                <>
                    <button onClick={() => setShowLoginForm(!showLoginForm)} className="cursor-pointer p-1 hover:border-1 rounded-xs">
                        <MdAccountCircle size={32} title="Login" />
                    </button>
                    {showLoginForm && (<LoginForm onClose={setShowLoginForm} />)}
                </>
            )}
        </div>
    </header>
  )
}

export default Header;