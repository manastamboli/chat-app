import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100/90 border-b border-base-300 fixed w-full top-0 z-40 
      backdrop-blur-xl shadow-sm"
    >
      <div className="container mx-auto px-4 lg:px-6 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-200">
              <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={"/settings"}
              className="btn btn-sm btn-ghost hover:bg-base-200 gap-2 transition-all duration-200 px-3"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link 
                  to={"/profile"} 
                  className="btn btn-sm btn-ghost hover:bg-base-200 gap-2 transition-all duration-200 px-3"
                >
                  <User className="size-4" />
                  <span className="hidden sm:inline font-medium">Profile</span>
                </Link>

                <button 
                  className="btn btn-sm btn-ghost hover:bg-base-200/80 hover:text-error gap-2 transition-all duration-200 px-3" 
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline font-medium">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
