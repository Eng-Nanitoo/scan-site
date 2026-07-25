import { useState, useRef, useCallback } from 'react';

export default function SmoothInput({ type, id, value, onChange, required, placeholder, style }) {
  const [isTyping, setIsTyping] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 50, y: 50 });
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = useCallback((e) => {
    onChange(e);

    setIsTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsTyping(false), 400);

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setRipplePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }
  }, [onChange]);

  return (
    <div
      ref={wrapperRef}
      className={`input-wrapper${isTyping ? ' typing' : ''}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="input-ripple"
        style={{ '--ripple-x': `${ripplePos.x}%`, '--ripple-y': `${ripplePos.y}%` }}
      />
      <input
        type={type}
        id={id}
        value={value}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        style={{ ...style, position: 'relative', zIndex: 1 }}
      />
    </div>
  );
}
