import React from 'react';
import './Sidebar.css';
import axios from "axios";
const Sidebar = () => {
  const handleLogout =async()=>{
    try {
      await axios.post(`http://localhost:5000/api/v1/verifyUser`,{
        withCredentials:true
      })
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>V-Call</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className="active">Dashboard</li>
          <li>Recent Calls</li>
          <li>Contacts</li>
          <li>Settings</li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar;