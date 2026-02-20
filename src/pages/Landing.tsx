import { useNavigate } from "react-router-dom";
import { User, ShieldCheck } from "lucide-react";
import logo from "@/assets/laundry_girl.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      {/* Admin icon top-right */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/admin-login")}
          className="p-2 rounded-full bg-muted hover:bg-accent/20 transition-colors"
          aria-label="Admin Login"
        >
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="animate-fade-in-up flex flex-col items-center gap-8 flex-1 justify-center max-w-sm mx-auto w-full">
        <img src={logo} alt="Laundry Girl Logo" className="w-36 h-36 object-contain" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-primary">LAUNDRY GIRL</h1>
          <p className="text-xs tracking-[0.12em] text-secondary">DOOR TO DOOR DRY CLEAN SERVICE</p>
        </div>

        <div className="flex flex-col gap-4 w-full mt-4">
          <button
            onClick={() => navigate("/customer-login")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            <User className="w-5 h-5" />
            Customer Login
          </button>
        </div>

        <p className="text-muted-foreground text-xs mt-6">Fresh clothes, delivered to your door</p>
      </div>
    </div>
  );
};

export default Landing;
