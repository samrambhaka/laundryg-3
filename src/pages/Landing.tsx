import { useNavigate } from "react-router-dom";
import { User, ShieldCheck } from "lucide-react";
import logo from "@/assets/laundry_girl.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="animate-fade-in-up flex flex-col items-center gap-8 w-full max-w-sm">
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
          <button
            onClick={() => navigate("/admin-login")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            <ShieldCheck className="w-5 h-5" />
            Admin Login
          </button>
        </div>

        <p className="text-muted-foreground text-xs mt-6">Fresh clothes, delivered to your door</p>
      </div>
    </div>
  );
};

export default Landing;
