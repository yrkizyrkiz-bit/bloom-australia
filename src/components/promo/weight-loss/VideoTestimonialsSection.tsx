"use client";

import { useState } from "react";
import { Play, X, Quote } from "lucide-react";

interface VideoTestimonial {
  id: string;
  name: string;
  location: string;
  weightLost: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  quote: string;
  initials: string;
}

const videoTestimonials: VideoTestimonial[] = [
  {
    id: "1",
    name: "Sarah M.",
    location: "Sydney, NSW",
    weightLost: "",
    duration: "5 months",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
    videoUrl: "https://assets.grok.com/users/23b82be6-9a02-443c-be1b-f160ab6a367b/generated/3546db14-af63-4d51-b5f3-3363281a54f5/generated_video.mp4?cache=1",
    quote: "I finally feel like myself again. The biomarker testing showed exactly why I was struggling, and my care partner Sarah was there every step of the way.",
    initials: "SM",
  },
  {
    id: "2",
    name: "Michael T.",
    location: "Melbourne, VIC",
    weightLost: "",
    duration: "4 months",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    videoUrl: "https://assets.grok.com/users/23b82be6-9a02-443c-be1b-f160ab6a367b/generated/3546db14-af63-4d51-b5f3-3363281a54f5/generated_video.mp4?cache=1",
    quote: "After years of trying different approaches, Sanative's doctor-led program finally worked. The medication combined with proper monitoring made all the difference.",
    initials: "MT",
  },
];

export function VideoTestimonialsSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const openVideo = (videoUrl: string) => {
    setActiveVideo(videoUrl);
  };

  const closeVideo = () => {
    setActiveVideo(null);
  };

  return (
    <section className="py-20 lg:py-28 bg-[#f4f7f2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#c17a58] font-serif text-lg italic">
            Real transformations
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif text-[#2c3628] mt-2">
            Hear from our patients
          </h2>
          <p className="mt-4 text-lg text-[#5c7a52] max-w-2xl mx-auto">
            Real stories from Australians who transformed their health with Sanative's
            doctor-led weight management program.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {videoTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={testimonial.thumbnail}
                  alt={`${testimonial.name}'s transformation story`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Play Button */}
                <button
                  onClick={() => openVideo(testimonial.videoUrl)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-[#5c7a52] ml-1" fill="#5c7a52" />
                  </div>
                </button>

                {/* Duration Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="px-3 py-2 bg-white/95 backdrop-blur-sm rounded-full">
                    <span className="text-[#5c7a52] font-medium text-sm">Patient for {testimonial.duration}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 lg:p-8">
                {/* Quote */}
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-[#e6ebe3]" />
                  <p className="text-[#5c7a52] leading-relaxed pl-6 italic">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5c7a52] to-[#7e9a72] flex items-center justify-center">
                      <span className="text-white font-medium">{testimonial.initials}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2c3628]">{testimonial.name}</p>
                      <p className="text-sm text-[#7e9a72]">{testimonial.location}</p>
                    </div>
                  </div>

                  {/* GAP-019: Removed star rating - health service advertising risk */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicator */}
        <div className="mt-12 text-center">
          <p className="text-[#7e9a72] text-sm">
            Trusted by thousands of Australians
          </p>
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeVideo}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 p-2 text-white hover:text-[#c17a58] transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Video Player */}
            <video
              src={activeVideo}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </section>
  );
}
