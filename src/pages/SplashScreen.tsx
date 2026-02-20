import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/laundry_girl.png";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/landing");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-scale-in flex flex-col items-center gap-6">
        <img src={logo} alt="Laundry Girl Logo" className="w-48 h-48 object-contain" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold tracking-[0.25em] text-primary">LAUNDRY GIRL</h1>
          <p className="text-sm tracking-[0.15em] text-secondary">DOOR TO DOOR DRY CLEAN SERVICE</p>
        </div>
      </div>
      <div className="absolute bottom-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default SplashScreen;
