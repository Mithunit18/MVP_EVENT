import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaEnvelope, FaHome, FaQrcode, FaUser, FaCalendarAlt, FaMapMarkerAlt, FaClock } from "react-icons/fa";

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, eventName, companyName, place, time, date, qrCode } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-6">
      
      {/* Main Card */}
      <div className="bg-white shadow-2xl rounded-2xl p-10 text-center max-w-lg w-full transform transition duration-500 hover:scale-105">

        {/* ✅ Success Header with Icon */}
        <div className="flex items-center justify-center mb-6">
          <FaCheckCircle className="text-green-500 text-5xl mr-2" />
          <h2 className="text-4xl font-extrabold text-green-700">
            Registration Successful for the event {eventName} 
          </h2>
        </div>

        {/* Event Info */}
        <div className="text-gray-700 mb-8">
          <p className="text-lg flex items-center justify-center">
            <FaUser className="mr-2 text-blue-500" /> <strong>{name}</strong>
          </p>
          <p className="flex items-center justify-center mt-2">
            <FaEnvelope className="mr-2 text-red-500" /> {email}
          </p>
          <p className="flex items-center justify-center mt-2">
            <FaCalendarAlt className="mr-2 text-purple-500" /> {eventName}
          </p>
          <p className="flex items-center justify-center mt-2">
            <FaClock className="mr-2 text-yellow-500" /> {date} | {time} (IST)
          </p>
          <p className="flex items-center justify-center mt-2">
            <FaMapMarkerAlt className="mr-2 text-pink-500" /> {place}
          </p>
        </div>

        {/* ✅ Center-aligned QR code with icon */}
        <div className="flex flex-col items-center justify-center mt-8">
          <FaQrcode className="text-blue-600 text-4xl mb-2" />
          <img 
            src={qrCode.startsWith("data:image") ? qrCode : `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200`}
            alt="QR Code"
            className="w-48 h-48 border-4 border-blue-500 rounded-lg shadow-lg"
          />
          <p className="text-gray-500 mt-3">Scan this QR code at the event entry</p>
        </div>

        {/* ✅ Navigation Button */}
        <button 
          onClick={() => navigate("/")} 
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full flex items-center justify-center transition duration-300"
        >
          <FaHome className="mr-2" /> Go to Home
        </button>
      </div>
    </div>
  );
}

export default SuccessPage;
