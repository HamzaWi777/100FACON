import logoImg from '../assets/logo.jpeg';

export function Logo() {
  return (
    <div className="flex flex-col items-center cursor-pointer select-none">
      <img
        src={logoImg}
        alt="100 FAÇONS"
        className="h-16 md:h-20 w-auto object-contain"
      />
      <div
        dir="rtl"
        style={{
          fontFamily: "'Tajawal', sans-serif",
          fontSize: "16px",
          marginTop: "4px",
          color: "#a855f7",
          fontWeight: 500,
        }}
      >
        ستايلك يبدأ من هنا
      </div>
    </div>
  );
}