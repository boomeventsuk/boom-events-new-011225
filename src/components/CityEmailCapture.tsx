import { Button } from "@/components/ui/button";

const CITIES = [
  "Bedford",
  "Coventry",
  "Leicester",
  "Luton",
  "Milton Keynes",
  "Northampton",
  "Somewhere else",
];

const CityEmailCapture = () => {
  return (
    <section id="city-waitlist" className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4 max-w-xl text-center">
        <h2 className="font-poppins text-2xl md:text-3xl font-bold text-foreground mb-2">
          Tell us your city, hear first when dates drop
        </h2>
        <p className="font-poppins text-muted-foreground mb-6">
          New dates sell through fast. Get them in your inbox before general release.
        </p>
        <form
          name="city-waitlist"
          method="POST"
          action="/thanks.html"
          data-netlify="true"
          className="flex flex-col sm:flex-row gap-3"
        >
          <input type="hidden" name="form-name" value="city-waitlist" />
          <select
            name="city"
            required
            aria-label="Your city"
            defaultValue=""
            className="flex-1 rounded-md border border-border bg-background px-4 py-3 font-poppins text-foreground"
          >
            <option value="" disabled>
              Your city
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <input
            type="email"
            name="email"
            required
            placeholder="Your email"
            aria-label="Your email"
            className="flex-1 rounded-md border border-border bg-background px-4 py-3 font-poppins text-foreground"
          />
          <Button type="submit" size="lg" className="font-poppins font-semibold">
            Keep me posted
          </Button>
        </form>
        <p className="font-poppins text-xs text-muted-foreground mt-3">
          No spam. Just tickets and dates for your city.
        </p>
      </div>
    </section>
  );
};

export default CityEmailCapture;
