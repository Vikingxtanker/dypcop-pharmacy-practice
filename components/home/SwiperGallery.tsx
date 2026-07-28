"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface GalleryImage {
  src: string;
  alt: string;
}

interface SwiperGalleryProps {
  images: GalleryImage[];
  title?: string;
  id?: string;
}

export default function SwiperGallery({ images, title, id }: SwiperGalleryProps) {
  const navId = id ?? "default";

  return (
    <div className="swiper tranding-slider">
      {title && <h3 className="text-center mb-4">{title}</h3>}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        loop
        centeredSlides
        slidesPerView={3}
        spaceBetween={20}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        navigation={{ nextEl: `#${navId}-next`, prevEl: `#${navId}-prev` }}
        pagination={{ clickable: true }}
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          992: { slidesPerView: 3 },
        }}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx}>
            <div className="tranding-slide">
              <img src={img.src} alt={img.alt} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div id={`${navId}-prev`} className="swiper-button-prev-custom slider-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M328 112L184 256l144 144"/></svg>
      </div>
      <div id={`${navId}-next`} className="swiper-button-next-custom slider-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="M184 112l144 144-144 144"/></svg>
      </div>
    </div>
  );
}
