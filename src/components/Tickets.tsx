import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import EventCard from "./EventCard";

const Tickets = () => {
  useEffect(() => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: "view_tickets_list" });
  }, []);

  // Helper function to convert date string to ISO format
  const dateToIso = (dateStr: string): string => {
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const parts = dateStr.split(' '); // ["Sat", "13", "Sep", "2025"]
    const day = parts[1].padStart(2, '0');
    const month = monthMap[parts[2]];
    const year = parts[3];
    return `${year}-${month}-${day}`;
  };

const events = [
  {
    title: "FOOTLOOSE 80s NORTHAMPTON — A MOST EXCELLENT 80s PARTY",
    date: "Sat 13 Sep 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "20:00–00:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707362/130925_FL80S_NPTON_MADSQ_y2vabp.png",
    bookUrl: "https://www.eventbrite.co.uk/e/footloose-80s-northampton-a-most-excellent-80s-party-tickets-1428897423659?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/1466091197726110"
  },
  {
    title: "SILENT DISCO MILTON KEYNES: POP VS INDIE VS DANCE",
    date: "Fri 19 Sep 2025",
    venue: "MK11 Music Venue",
    city: "Milton Keynes",
    time: "20:30–00:30",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707388/190925_SDB_MK_No_Comp_Sq_kxxd8v.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/greatest-hits-silent-disco-milton-keynes-tickets-1345076533120?WEBLINK=",
    infoUrl: "https://www.facebook.com/events/1747332309299707"
  },
  {
    title: "FOOTLOOSE 80s DAY PARTY BEDFORD",
    date: "Sat 20 Sep 2025",
    venue: "Bedford Esquires",
    city: "Bedford",
    time: "14:00–18:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707416/200925_FL80SDAY_BED_ANNSQ_zkjjkx.png",
    bookUrl: "https://www.eventbrite.co.uk/e/footloose-80s-day-party-bedford-tickets-1424442368469?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/1238442701296733"
  },
  {
    title: "SILENT DISCO NORTHAMPTON: POP VS INDIE VS DANCE",
    date: "Sat 27 Sep 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "20:30–00:30",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707490/270925_SDB_NPTON_No_Comp_Sq_rej6xu.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/greatest-hits-silent-disco-northampton-tickets-1345076533119?WEBLINK=",
    infoUrl: "https://www.facebook.com/events/1747332309299706"
  },
  {
    title: "THE 2PM CLUB™ COVENTRY - 80s 90s 00s Daytime Disco",
    date: "Sat 4 Oct 2025",
    venue: "hmv Empire",
    city: "Coventry",
    time: "14:00–18:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757520205/041025_2PM_COV_ANNSQ_i62sjk.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/daytime-disco-presents-the-2pm-club-coventry-80s-90s-00s-anthems-tickets-1443614914069?aff=BOOMWEB",
    infoUrl: ""
  },
  {
    title: "THE 2PM CLUB™ MK - 80s 90s 00s Daytime Disco",
    date: "Sat 11 Oct 2025",
    venue: "MK11 Music Venue",
    city: "Milton Keynes",
    time: "14:00–16:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757522739/111025_2PM_MK_ANNSQv2_tttdip.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/daytime-disco-presents-the-2pm-clubtm-milton-keynes-80s-90s-00s-anthems-tickets-1403881610689",
    infoUrl: "https://www.facebook.com/events/710462968194939"
  },
  {
    title: "THE 2PM CLUB™ NORTHAMPTON - 80s 90s 00s Daytime Disco",
    date: "Sat 18 Oct 2025",
    venue: "cinch Stadium at Franklin's Gardens",
    city: "Northampton",
    time: "14:00–18:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757522765/181025_2PM_NPTON_ANNSQ_guiuq7.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/the-2pm-clubtm-northampton-80s-90s-00s-daytime-disco-tickets-1557588823099?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/1099596238372820"
  },
  {
    title: "FAMILY SILENT DISCO Halloween Party Bedford",
    date: "Sat 25 Oct 2025",
    venue: "Bedford Esquires",
    city: "Bedford",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707691/251025_FSD_BED_ANNSQ_a8ssvu.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/family-silent-disco-bedford-tickets-1561886166569?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/3683417485127436"
  },
  {
    title: "THE 2PM CLUB™ BIRMINGHAM - 80s 90s 00s Daytime Disco",
    date: "Sat 25 Oct 2025",
    venue: "The Castle & Falcon",
    city: "Birmingham",
    time: "14:00–18:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757522785/251025_2PM_BHAM_ANNSQ_exjo6v.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/the-2pm-clubtm-birmingham-80s-90s-00s-daytime-disco-tickets-1559435135469?aff=BOOMWEB",
    infoUrl: "https://www.facebook.com/events/1252072186162573"
  },
  {
    title: "FAMILY SILENT DISCO Halloween Party Northampton",
    date: "Sun 26 Oct 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707885/261025_FSD_NPTON_ANNSQ_kvh0xf.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/family-silent-disco-halloween-edition-northampton-tickets-1656258296149?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/772814442110884"
  },
  {
    title: "FAMILY SILENT DISCO Halloween Party Milton Keynes",
    date: "Sun 26 Oct 2025",
    venue: "MK11 Music Venue",
    city: "Milton Keynes",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707840/261025_FSD_MK_ANNSQ_mcs86y.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/family-silent-disco-halloween-edition-milton-keynes-tickets-1663986531509?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/801356105664017"
  },
  {
    title: "FAMILY SILENT DISCO Halloween Party Milton Keynes",
    date: "Sun 26 Oct 2025",
    venue: "MK11 Music Venue",
    city: "Milton Keynes",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707840/261025_FSD_MK_ANNSQ_mcs86y.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/family-silent-disco-halloween-edition-milton-keynes-tickets-1663986531509?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/801356105664017"
  },
  {
    title: "THE 2PM CLUB™ LUTON - 80s 90s 00s Daytime Disco",
    date: "Sat 1 Nov 2025",
    venue: "Hat Factory",
    city: "Luton",
    time: "14:00–18:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757522804/011125_2PM_LUT_ANNSQ_ecaqla.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/the-2pm-clubtm-luton-80s-90s-00s-daytime-disco-tickets-1645025849599?aff=BOOMWEB",
    infoUrl: "https://www.facebook.com/events/1277593650522747"
  },
  {
    title: "FAMILY SILENT DISCO Luton",
    date: "Sun 16 Nov 2025",
    venue: "Hat Factory",
    city: "Luton",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707934/161125_FSD_LUT_ANNSQ_po9s9u.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/family-silent-disco-luton-tickets-1567321212939?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/23962803433390828"
  },
  {
    title: "CHRISTMAS SILENT DISCO NORTHAMPTON",
    date: "Fri 5 Dec 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "20:30–00:30",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757707947/051225_SD_NPTON_ANNSQ_ryaint.png",
    bookUrl: "https://www.eventbrite.co.uk/e/boombastics-christmas-silent-disco-2025-tickets-1544387427369?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/600708973096782"
  },
  {
    title: "THE 2PM CLUB™ Northampton - Christmas Daytime Disco",
    date: "Sat 6 Dec 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "14:00–17:30",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757522817/061225_2PM_NPTON_ANNSQ_pcnhtp.png",
    bookUrl: "https://www.eventbrite.co.uk/e/the-2-pm-clubtm-northampton-christmas-daytime-disco-tickets-1544458540069?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/928404249476093"
  },
  {
    title: "Boombastic's Christmas Decades Party NORTHAMPTON",
    date: "Sat 6 Dec 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "20:30–00:30",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757708050/061225_BOOMPM_NPTON_ANNSQ_fbwdg1.png",
    bookUrl: "https://www.eventbrite.co.uk/e/boombastics-christmas-decades-party-tickets-1544512260749?aff=BoomWeb",
    infoUrl: "https://www.facebook.com/events/726210763537267"
  },
  {
    title: "Christmas FAMILY SILENT DISCO Northampton",
    date: "Sun 7 Dec 2025",
    venue: "The Picturedrome",
    city: "Northampton",
    time: "13:00–15:00",
    poster: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757708067/071225_FSD_NPTON_ANNSQ_lgpd73.jpg",
    bookUrl: "https://www.eventbrite.co.uk/e/christmas-family-silent-disco-northampton-tickets-1656839334049?aff=FBLink",
    infoUrl: "https://www.facebook.com/events/768151506076732"
  }
];

  return (
    <section id="tickets" className="py-lg bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-lg">
          <h2 className="font-bebas text-5xl md:text-6xl font-bold text-foreground mb-4">
            Upcoming Dates
          </h2>
          <p className="font-poppins text-xl text-muted-foreground max-w-2xl mx-auto">
            Book your tickets now for the next epic party experience across the Midlands
          </p>
        </div>

        {/* Christmas Banner */}
        <div 
          className="bg-gradient-to-r from-red-600/20 to-green-600/20 border border-red-600/30 rounded-lg p-4 mb-8 text-center hidden" 
          data-banner="christmas"
        >
          <p className="font-poppins text-lg font-semibold text-foreground">
            🎄 Christmas dates now on sale
          </p>
        </div>
        
        <div className="space-y-6" id="tickets-list">
          {events.map((event, index) => (
            <EventCard key={index} {...event} dateIso={dateToIso(event.date)} />
          ))}
        </div>
        
        <div className="text-center mt-lg">
          <Button 
            id="view-all-tickets"
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
          >
            View All Tickets
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Tickets;