// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import PrimeService from "./Pages/prime_services/prime_services";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* Home Page */}
//         <Route
//           path="/"
//           element={
//             <div style={{ textAlign: "center", marginTop: "50px" }}>
//               <h2>Welcome to My App</h2>
//               <nav>
//                 <Link to="/prime-services" style={{ fontSize: "20px", color: "blue" }}>
//                   Go to Prime Service Management
//                 </Link>
//               </nav>
//               <br />
//               <div style={{ border: "1px solid #ccc", padding: "20px", margin: "20px" }}>
//                 <h3>Quick Preview:</h3>
//                 <PrimeService />
//               </div>
//             </div>
//           }
//         />

//         {/* Prime Service Page */}
//         <Route
//           path="/prime-services"
//           element={<PrimeService />}
//         />

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./Components/Sidebar/sidebar.jsx";
import Dashboard from "./Components/Dashboard/dashboard.jsx";
import PrimeService from "./Pages/prime_services/prime_services.jsx";
import PrimeCategories from "./Pages/prime_services/prime_categories.jsx";
import CategoryProducts from "./Pages/prime_services/category_products.jsx";
import ManpowerDetails from "./Pages/prime_services/manpower_details.jsx";
import BuilderDetails from "./Pages/prime_services/builder_details.jsx";
import DemolatorDetails from "./Pages/prime_services/demolators_details.jsx";
import MaterialProducts from "./Pages/prime_services/material_products.jsx";
import MaterialProductDetails from "./Pages/prime_services/material_product_details.jsx";
import BlogManagement from "./Pages/prime_services/blog_management.jsx";
import RenovationDetails from "./Pages/prime_services/renovation_details.jsx";
import RenovationProductDetails from "./Pages/prime_services/renovation_product_details.jsx";
import ProjectsTenders from "./Pages/prime_services/projects_tenders.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prime-services" element={<PrimeService />} />
            <Route path="/prime-categories/:serviceId" element={<PrimeCategories />} />
            <Route path="/category-products/:categoryId" element={<CategoryProducts />} />
            <Route path="/material-products/:categoryId" element={<MaterialProducts />} />
            <Route path="/material-product-details/:productId" element={<MaterialProductDetails />} />
            <Route path="/manpower-details/:categoryId" element={<ManpowerDetails />} />
            <Route path="/builder-details/:categoryId" element={<BuilderDetails />} />
            <Route path="/demolator-details/:categoryId" element={<DemolatorDetails />} />
            <Route path="/blog-management" element={<BlogManagement />} />
            <Route path="/renovation-details/:categoryId" element={<RenovationDetails />} />
            <Route path="/renovation-product-details/:productId" element={<RenovationProductDetails />} />
            <Route path="/projects-tenders" element={<ProjectsTenders />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
