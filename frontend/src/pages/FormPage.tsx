import React, { useState } from "react";

const FormPage: React.FC = () => {
  const [formData, setFormData] = useState({
    destination: "",
    duration: "",
    budget: "",
    interests: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    // Save the data or handle it as needed
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Plan Your Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Destination</label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Enter your destination"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Trip Duration</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Enter trip duration (e.g., 5 days)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Budget</label>
          <input
            type="text"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Enter your budget"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Interests</label>
          <textarea
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Enter your interests (e.g., food, hiking)"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save
        </button>
      </form>
    </div>
  );
};

export default FormPage;