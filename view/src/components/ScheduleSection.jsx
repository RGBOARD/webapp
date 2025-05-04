import React from 'react';

export default function ScheduleSection({
  scheduleData,
  setScheduleData,
  onSubmit,
  submitLabel = "Add to Queue",
  error,
}) {
  return (
    <div className="scheduling-section p-4 border rounded-lg space-y-3">
      <h3 className="text-xl font-bold">Add to Queue</h3>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex flex-col space-y-2">
        <label className="font-medium">Start Time:</label>
        <input
          type="datetime-local"
          value={scheduleData.start_time}
          onChange={e =>
            setScheduleData({ ...scheduleData, start_time: e.target.value })
          }
          className="border p-2 rounded"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="font-medium">End Time:</label>
        <input
          type="datetime-local"
          value={scheduleData.end_time}
          onChange={e =>
            setScheduleData({ ...scheduleData, end_time: e.target.value })
          }
          className="border p-2 rounded"
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="upload-button queue-button"
      >
        <span className="button-text">{submitLabel}</span>
      </button>
    </div>
  );
}
