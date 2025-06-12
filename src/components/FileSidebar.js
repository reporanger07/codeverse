import React, { useState, useEffect, useRef } from "react";

const FileSidebar = ({
  files,
  onFileSelect,
  onNewFile,
  onFileDelete,
  onFileRename,
  activeFile,
}) => {
  const [menuData, setMenuData] = useState({
    visible: false,
    x: 0,
    y: 0,
    file: null,
  });
  const sidebarRef = useRef(null);

  // This effect handles closing the menu if you click outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // A small timeout helps prevent race conditions with the menu opening
      setTimeout(() => {
        if (menuData.visible) {
          setMenuData({ visible: false, x: 0, y: 0, file: null });
        }
      }, 100);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuData.visible]);

  const handleNewFile = () => {
    const fileName = prompt("Enter new file name (e.g., styles.css):");
    if (fileName && fileName.trim() !== "") {
      onNewFile(fileName.trim());
    }
  };

  const handleMenuClick = (e, fileName) => {
    e.stopPropagation(); // Stop the click from closing the menu immediately
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuData({
      visible: true,
      // Position menu below and to the left of the "dots" button
      x: rect.left - 80, // 80 is approx menu width minus button width
      y: rect.top + rect.height,
      file: fileName,
    });
  };

  const handleRename = (file) => {
    const newFileName = prompt(`Enter new name for ${file}:`, file);
    if (newFileName && newFileName.trim() !== "" && newFileName !== file) {
      onFileRename(file, newFileName.trim());
    }
    setMenuData({ visible: false, x: 0, y: 0, file: null }); // Close menu
  };

  const handleDelete = (file) => {
    if (window.confirm(`Are you sure you want to delete ${file}?`)) {
      onFileDelete(file);
    }
    setMenuData({ visible: false, x: 0, y: 0, file: null }); // Close menu
  };

  return (
    <>
      {" "}
      {/* Use a React Fragment to render menu outside the normal flow */}
      <div className="fileManager" ref={sidebarRef}>
        <h3 className="fileManagerTitle">File Manager</h3>
        <ul className="fileList">
          {files.map((file) => (
            <li
              key={file}
              className={`fileItem ${file === activeFile ? "active" : ""}`}
              onClick={() => onFileSelect(file)}
            >
              <span className="fileName">{file}</span>
              <button
                className="btn menuButton"
                onClick={(e) => handleMenuClick(e, file)}
              >
                ⋮
              </button>
            </li>
          ))}
        </ul>
        <button className="btn newFileBtn" onClick={handleNewFile}>
          + New File
        </button>
      </div>
      {/* The single, floating menu */}
      {menuData.visible && (
        <div
          className="fileMenu"
          style={{ top: `${menuData.y}px`, left: `${menuData.x}px` }}
        >
          <button onClick={() => handleRename(menuData.file)}>Rename</button>
          <button
            className="deleteOption"
            onClick={() => handleDelete(menuData.file)}
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default FileSidebar;
