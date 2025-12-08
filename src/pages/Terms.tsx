import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-poppins">Back to Events</span>
        </Link>
      </nav>

      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-bebas text-5xl md:text-6xl text-foreground mb-8">
          TERMS & CONDITIONS
        </h1>
        
        <p className="text-muted-foreground font-poppins">
          Content coming soon.
        </p>
      </div>
    </div>
  );
};

export default Terms;
