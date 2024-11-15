import { ReactElement, ReactNode, useState } from "react";

export default function Tooltip({
  children,
  components,
}: {
  children: ReactNode;
  components: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div className="absolute transform bottom-full mb-2 p-3 bg-gray-800 text-white text-sm rounded shadow-lg w-[200px]">
          {components}
        </div>
      )}
    </span>
  );
}
