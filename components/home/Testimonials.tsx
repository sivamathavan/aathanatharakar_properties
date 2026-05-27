import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Property Buyer",
    content: "Aadana Tharakar made buying our dream home in Coimbatore so easy. The transparency and support from their verified agents was incredible.",
    rating: 5,
  },
  {
    name: "Meenakshi Sundaram",
    role: "Home Owner",
    content: "I listed my ancestral property in Madurai here. Within two weeks, I found a genuine buyer. The platform is secure and highly professional.",
    rating: 5,
  },
  {
    name: "Karthik Raj",
    role: "Real Estate Investor",
    content: "The best platform in Tamil Nadu for finding prime commercial plots. The verified listings save me so much time and effort.",
    rating: 5,
  }
];

export function Testimonials() {
  return (
    <section className="py-16 bg-white border-y border-[#E8E0D0]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-navy-900 mb-3">What Our Clients Say</h2>
          <p className="text-gray-500 font-sans text-sm max-w-xl mx-auto">
            Don't just take our word for it. Here's what buyers and sellers across Tamil Nadu think about our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, idx) => (
            <Card key={idx} className="bg-cream-50 border-[#E8E0D0] rounded-xl hover:shadow-md transition-shadow relative">
              <CardContent className="p-8 pt-10">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-gold-300 opacity-50" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                
                <p className="text-navy-800 font-sans text-sm italic leading-relaxed mb-6">
                  "{t.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold font-display text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-navy-900 font-bold font-sans text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500 font-sans">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
