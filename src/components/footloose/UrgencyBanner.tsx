interface UrgencyBannerProps {
  message: string;
}

export const UrgencyBanner = ({ message }: UrgencyBannerProps) => {
  return (
    <div className="bg-destructive text-destructive-foreground py-3 px-4">
      <div className="container mx-auto text-center">
        <p className="text-lg md:text-xl font-bold tracking-wide animate-pulse">
          🔥 {message} 🔥
        </p>
      </div>
    </div>
  );
};
