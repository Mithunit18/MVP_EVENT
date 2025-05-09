import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Utility to dynamically extract name & email from registrationData
function extractNameAndEmail(registrationData = {}) {
  const nameField = Object.keys(registrationData).find((key) =>
    key.toLowerCase().includes("name")
  );
  const emailField = Object.keys(registrationData).find((key) =>
    key.toLowerCase().includes("mail")
  );

  const name = nameField ? registrationData[nameField] : "";
  const email = emailField ? registrationData[emailField] : "";

  return { name, email };
}

// Utility to dynamically extract contact from registrationData
function extractContact(registrationData = {}) {
  const contactField = Object.keys(registrationData).find((key) => {
    const lowerKey = key.toLowerCase();
    return (
      lowerKey.includes("contact") ||
      lowerKey.includes("mobile") ||
      lowerKey.includes("phone") ||
      lowerKey.includes("number")
    );
  });

  const contact = contactField ? registrationData[contactField] : "";
  return contact;
}

function SummaryCard({ title, value, color }) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
  };

  const selectedColor = colors[color] || "bg-gray-500";

  return (
    <div className={`rounded-xl shadow-md p-4 text-white ${selectedColor}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const companyName = localStorage.getItem("adminCompany");
  const selectedEvent = localStorage.getItem("selectedEvent");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          toast.error("Unauthorized! Please log in.");
          navigate("/admin/login");
          return;
        }

        const response = await axios.get(`${BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { companyName, eventId: selectedEvent, page: currentPage, limit: 10 },
        });

        const filteredUsers = response.data.users || [];
        setUsers(filteredUsers);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        toast.error("Failed to fetch users. Please try again.");
      }
    };

    fetchUsers();
  }, [navigate, companyName, selectedEvent, currentPage, BASE_URL]);

  const downloadPDF = () => {
    const filteredUsers = getFilteredUsers();
    if (filteredUsers.length === 0) {
      toast.error("No data available to download!");
      return;
    }

    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("Registered Users", 14, 20);

    const headers = [["Name", "Email", "Role", "Contact", "Privileges"]];

    const data = filteredUsers.map((user) => {
      const { name, email } = extractNameAndEmail(user.registrationData);
      const contact = extractContact(user.registrationData);
      const privileges = (user.privileges ?? []).length > 0
        ? user.privileges
            .map(
              (p) =>
                `${p.name?.toUpperCase()} (${p.claim ? "Claimed" : "Not Claimed"})`
            )
            .join(", ")
        : "No privileges assigned";

      return [name, email, user.registrationData.role, contact, privileges];
    });

    autoTable(pdf, {
      startY: 30,
      head: headers,
      body: data,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    pdf.save("registered_users.pdf");
    toast.success("PDF downloaded successfully!");
  };

  const getFilteredUsers = () => {
    return users.filter((user) => {
      const { name, email } = extractNameAndEmail(user.registrationData);
      const role = user.registrationData?.role || "";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || role === roleFilter;
      return matchesSearch && matchesRole;
    });
  };

  const getPrivilegeSummary = () => {
    const summary = {};

    users.forEach((user) => {
      (user.privileges ?? []).forEach((priv) => {
        const name = priv.name?.toUpperCase();
        if (!name) return;

        if (!summary[name]) {
          summary[name] = { claimed: 0, total: 0 };
        }
        summary[name].total += 1;
        if (priv.claim) {
          summary[name].claimed += 1;
        }
      });
    });

    return summary;
  };

  const totalRegistrations = users.length;
  const uniqueRoles = [...new Set(users.map((u) => u.registrationData?.role).filter(Boolean))];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminCompany");
    toast.success("Logged out successfully!");
    navigate("/admin/login");
  };

  const handlePagination = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="bg-white p-6 shadow-xl rounded-2xl w-full max-w-7xl">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-2 text-center">
          Admin Dashboard
        </h2>
        <p className="text-center text-lg mb-6 text-gray-600">
          Company:{" "}
          <span className="font-semibold text-blue-600">{companyName}</span>
        </p>

        {/* Event Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="Total Registrations" value={totalRegistrations} color="blue" />
        </div>

        {/* Privilege Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(getPrivilegeSummary()).map(([privName, data], idx) => {
            const color =
              data.claimed === data.total
                ? "green"
                : data.claimed > 0
                ? "yellow"
                : "red";

            return (
              <SummaryCard
                key={idx}
                title={privName}
                value={`${data.claimed} / ${data.total} Claimed`}
                color={color}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-blue-400"
            >
              <option value="All">All Roles</option>
              {uniqueRoles.map((role, idx) => (
                <option key={idx} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <button
              onClick={downloadPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow"
            >
              Download PDF
            </button>

            <button
              onClick={() => navigate("/admin/manage-access")}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition shadow"
            >
              Manage Access
            </button>

            <button
              onClick={() => navigate("/create-regform")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
            >
              Create Registration Form
            </button>

            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition shadow"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-500 text-white text-sm">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Privileges</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map((user, index) => {
                const { name, email } = extractNameAndEmail(user.registrationData);
                const contact = extractContact(user.registrationData);
                const privileges = user.privileges ?? [];

                return (
                  <tr
                    key={index}
                    className="text-center border-b hover:bg-gray-100 transition text-sm"
                  >
                    <td className="p-3">{name}</td>
                    <td className="p-3">{email}</td>
                    <td className="p-3">{user.registrationData?.role}</td>
                    <td className="p-3">{contact}</td>
                    <td className="p-3">
                      {privileges.length > 0 ? (
                        <ul className="text-left space-y-1">
                          {privileges.map((priv, idx) => (
                            <li key={idx} className="flex items-center gap-1 text-xs">
                              <span className="font-semibold">{priv.name?.toUpperCase()}</span> —{" "}
                              {priv.claim ? (
                                <span className="text-green-600">Claimed</span>
                              ) : (
                                <span className="text-red-600">Not Claimed</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500 text-xs italic">
                          No privileges assigned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {getFilteredUsers().length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">
              No matching users found.
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => handlePagination(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-400 text-white rounded-md mr-2"
          >
            Previous
          </button>
          <button
            onClick={() => handlePagination(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-400 text-white rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
