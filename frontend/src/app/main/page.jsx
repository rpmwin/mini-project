"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

function Main() {
  const [grid, setGrid] = useState(
    Array(20)
      .fill(null)
      .map(() => Array(25).fill(null))
  );
  const [commandArray, setCommandArray] = useState([]);
  const [rooms, setRooms] = useState({
    room1: {
      top_left: [5, 0],
      bottom_right: [9, 4],
      color: "bg-green-500",
    },
    room2: {
      top_left: [10, 0],
      bottom_right: [14, 4],
      color: "bg-blue-500",
    },
    room3: {
      top_left: [15, 0],
      bottom_right: [19, 4],
      color: "bg-green-500",
    },
    // Add more rooms here
  });

  const specialCells = {
    roomdoor1: [7, 5],
    roomdoor2: [12, 5],
    roomdoor3: [17, 5],
    mainhub: [19, 10],
    // Add more special cells here
  };

  const [selectedCells, setSelectedCells] = useState([]);
  const [nonWalkableCells, setNonWalkableCells] = useState([]);
  const [path, setPath] = useState(
    JSON.parse(localStorage.getItem("path")) || []
  );
  const [savedPaths, setSavedPaths] = useState(
    JSON.parse(localStorage.getItem("savedPaths")) || []
  );
  const [loadedPathDescription, setLoadedPathDescription] = useState("");
  const [markingNonWalkable, setMarkingNonWalkable] = useState(false);

  useEffect(() => {
    if (selectedCells.length > 1) {
      let fullPath = [];
      for (let i = 0; i < selectedCells.length - 1; i++) {
        const segment = findPath(selectedCells[i], selectedCells[i + 1]);
        if (segment.length > 0) {
          fullPath = [...fullPath, ...segment];
        }
      }
      setPath(fullPath);
      localStorage.setItem("path", JSON.stringify(fullPath));
    }
  }, [selectedCells]);

  const findPath = (start, end) => {
    const queue = [[start]];
    const visited = new Set();
    visited.add(start.toString());

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const [currentRow, currentCol] = currentPath[currentPath.length - 1];

      if (currentRow === end[0] && currentCol === end[1]) {
        return currentPath;
      }

      for (const [dRow, dCol] of directions) {
        const newRow = currentRow + dRow;
        const newCol = currentCol + dCol;
        if (
          newRow >= 0 &&
          newRow < grid.length &&
          newCol >= 0 &&
          newCol < grid[0].length &&
          !visited.has([newRow, newCol].toString()) &&
          !nonWalkableCells.some(
            (cell) => cell[0] === newRow && cell[1] === newCol
          )
        ) {
          visited.add([newRow, newCol].toString());
          queue.push([...currentPath, [newRow, newCol]]);
        }
      }
    }

    return [];
  };

  const getRoomClass = (rowIndex, colIndex) => {
    if (
      path.some(
        ([pathRow, pathCol]) => pathRow === rowIndex && pathCol === colIndex
      )
    ) {
      return "bg-purple-600"; // Highlight path with a different color
    }

    for (const room in rooms) {
      const { top_left, bottom_right, color } = rooms[room];
      if (
        rowIndex >= top_left[0] &&
        rowIndex <= bottom_right[0] &&
        colIndex >= top_left[1] &&
        colIndex <= bottom_right[1]
      ) {
        let borderClasses = "";
        if (rowIndex === top_left[0])
          borderClasses += " border-t-4 border-black";
        if (rowIndex === bottom_right[0])
          borderClasses += " border-b-4 border-black";
        if (colIndex === top_left[1])
          borderClasses += " border-l-4 border-black";
        if (colIndex === bottom_right[1])
          borderClasses += " border-r-4 border-black";
        return `${color} ${borderClasses}`;
      }
    }

    for (const cell in specialCells) {
      const [cellRow, cellCol] = specialCells[cell];
      if (rowIndex === cellRow && colIndex === cellCol) {
        if (cell.startsWith("roomdoor")) return "bg-red-600"; // Color for room doors
        if (cell.startsWith("mainhub")) return "bg-orange-600"; // Color for main hub
      }
    }

    if (
      nonWalkableCells.some(
        ([nonWalkRow, nonWalkCol]) =>
          nonWalkRow === rowIndex && nonWalkCol === colIndex
      )
    ) {
      return "bg-gray-800"; // Non-walkable cells
    }

    for (const [index, [selRow, selCol]] of selectedCells.entries()) {
      if (rowIndex === selRow && colIndex === selCol) {
        return `bg-${index % 2 === 0 ? "yellow" : "orange"}-600`; // Different colors for selected cells
      }
    }

    return "bg-gray-400"; // Default color
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (markingNonWalkable) {
      if (
        !nonWalkableCells.some(
          ([nonWalkRow, nonWalkCol]) =>
            nonWalkRow === rowIndex && nonWalkCol === colIndex
        )
      ) {
        setNonWalkableCells([...nonWalkableCells, [rowIndex, colIndex]]);
      }
    } else {
      // Always append the new cell to the selectedCells array
      setSelectedCells([...selectedCells, [rowIndex, colIndex]]);
    }
  };

  const undoLastSelection = () => {
    if (selectedCells.length > 0) {
      const newSelectedCells = selectedCells.slice(0, -1);
      setSelectedCells(newSelectedCells);

      let fullPath = [];
      for (let i = 0; i < newSelectedCells.length - 1; i++) {
        const segment = findPath(newSelectedCells[i], newSelectedCells[i + 1]);
        if (segment.length > 0) {
          fullPath = [...fullPath, ...segment];
        }
      }
      setPath(fullPath);
      localStorage.setItem("path", JSON.stringify(fullPath));
    }
  };

  const savePath = () => {
    const pathName = prompt("Enter a name for the path:");
    if (pathName) {
      const newSavedPaths = [...savedPaths, { name: pathName, path }];
      setSavedPaths(newSavedPaths);
      localStorage.setItem("savedPaths", JSON.stringify(newSavedPaths));
    }
  };

  const deletePath = (index) => {
    const newSavedPaths = savedPaths.filter((_, i) => i !== index);
    setSavedPaths(newSavedPaths);
    localStorage.setItem("savedPaths", JSON.stringify(newSavedPaths));
  };

  const loadPath = (path) => {
    setPath(path);
    setLoadedPathDescription(getPathDescription(path));
  };

  const createNewPath = () => {
    setSelectedCells([]);
    setPath([]);
    setLoadedPathDescription("");
    localStorage.removeItem("path");
  };

  const getPathDescription = (path) => {
    if (path.length < 2) return [];

    const directions = [];
    console.log(path);
    for (let i = 1; i < path.length; i++) {
      const [prevRow, prevCol] = path[i - 1];
      const [currRow, currCol] = path[i];

      if (currRow > prevRow) directions.push("down");
      else if (currRow < prevRow) directions.push("up");
      else if (currCol > prevCol) directions.push("right");
      else if (currCol < prevCol) directions.push("left");
    }
    console.log(directions);

    const commands = [];
    let stepCount = 1;
    let currentDirection = "north"; // Assuming you start facing north
    const directionMap = {
      up: "north",
      down: "south",
      right: "east",
      left: "west",
    };

    // Determine initial direction
    if (directions.length > 0) {
      currentDirection = directionMap[directions[0]];
    }

    for (let i = 1; i < directions.length; i++) {
      const newDirection = directionMap[directions[i]];

      if (directions[i] === directions[i - 1]) {
        stepCount++;
      } else {
        if (directions[i] === "up" || directions[i] === "down") {
          if (currentDirection === "east" && directions[i] === "up") {
            commands.push(
              `Direction ${currentDirection} move forward ${stepCount} steps, turn left, new direction ${newDirection}`
            );
          } else if (currentDirection === "west" && directions[i] === "up") {
            commands.push(
              `Direction ${currentDirection} move forward ${stepCount} steps, turn right, new direction ${newDirection}`
            );
          } else if (currentDirection === "east" && directions[i] === "down") {
            commands.push(
              `Direction ${currentDirection} move forward ${stepCount} steps, turn right, new direction ${newDirection}`
            );
          } else if (currentDirection === "west" && directions[i] === "down") {
            commands.push(
              `Direction ${currentDirection} move forward ${stepCount} steps, turn left, new direction ${newDirection}`
            );
          }
        } else {
          commands.push(
            `Direction ${currentDirection} move forward ${stepCount} steps, turn ${directions[i]}, new direction ${newDirection}`
          );
        }
        currentDirection = newDirection;
        stepCount = 1;
      }
    }

    commands.push(
      `Direction ${currentDirection} move forward ${stepCount} steps`
    );

    console.log(commands);

    setCommandArray(generateCommandArray(commands));

    console.log(generateCommandArray(commands));

    return commands;
  };

  const executeRoute = async () => {
    // const commandArray = generateCommandArray(path); // Generate command array from path
    try {
      axios
        .post("http://192.168.31.117:8000/send-commands", {
          commands: commandArray,
        })
        .then((response) => {
          console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  };

  function generateCommandArray(routeDescription) {
    const commands = [];
    routeDescription.forEach((description) => {
      if (typeof description !== "string") {
        console.error(
          "Expected description to be a string, but got:",
          typeof description
        );
        return; // Skip processing for non-string descriptions
      }

      // Split description into individual commands
      const parts = description.split(", ");
      parts.forEach((part) => {
        if (part.includes("move forward")) {
          const steps = parseInt(part.match(/\d+/)[0], 10);
          for (let i = 0; i < steps; i++) {
            commands.push("move forward");
          }
        } else if (part.includes("turn")) {
          commands.push(part);
        }
      });
    });
    commands.push("stop");
    return commands;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={createNewPath}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Path
        </button>
        <button
          onClick={savePath}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save Path
        </button>
        <button
          onClick={undoLastSelection}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Undo Last Selection
        </button>
        <button
          onClick={executeRoute}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Execute Route
        </button>
        <button
          onClick={() => setMarkingNonWalkable(!markingNonWalkable)}
          className={`px-4 py-2 rounded ${
            markingNonWalkable
              ? "bg-gray-700 text-white"
              : "bg-gray-500 text-white"
          } hover:bg-gray-600`}
        >
          {markingNonWalkable ? "Marking Non-Walkable" : "Mark Non-Walkable"}
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Saved Paths</h2>
        <ul>
          {savedPaths.map((savedPath, index) => (
            <li key={index} className="flex items-center mb-2">
              <span className="mr-2">{savedPath.name}</span>
              <button
                onClick={() => loadPath(savedPath.path)}
                className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Load
              </button>
              <button
                onClick={() => deletePath(index)}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {loadedPathDescription && (
        <div className="mt-4 p-4 bg-gray-900 text-white">
          <h3 className="text-lg font-bold">Route Description:</h3>
          <ul>
            {loadedPathDescription.map((command, index) => (
              <li key={index}>{command}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((col, colIndex) => (
              <div
                key={colIndex}
                className={`w-10 h-10 m-0.5 ${getRoomClass(
                  rowIndex,
                  colIndex
                )}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Main;
