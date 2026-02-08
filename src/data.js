// Mock data for the system
export const colleges = [
  "College of Information Technology and Computing",
  "College of Engineering",
  "College of Science and Mathematics",
  "College of Technology",
  "College of Arts and Sciences"
];

export const availableGadgets = [
  { id: 1, name: "Laptop - Dell XPS 13", category: "Laptop", status: "Available", dailyRate: 250 },
  { id: 2, name: "iPad Pro 12.9", category: "Tablet", status: "Available", dailyRate: 150 },
  { id: 3, name: "DSLR Camera - Canon EOS", category: "Camera", status: "Rented", dailyRate: 300 },
  { id: 4, name: "Projector - Epson EB", category: "AV Equipment", status: "Available", dailyRate: 200 },
  { id: 5, name: "Graphics Tablet - Wacom", category: "Design", status: "Maintenance", dailyRate: 100 }
];

export const userRentals = [
  { id: 101, gadget: "MacBook Pro 14", rentDate: "2024-03-15", returnDate: "2024-03-20", status: "Active" },
  { id: 102, gadget: "GoPro Hero 11", rentDate: "2024-03-10", returnDate: "2024-03-12", status: "Returned" }
];