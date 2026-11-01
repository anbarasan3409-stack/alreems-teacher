import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, BookOpen, Trash2, Link as LinkIcon, File } from 'lucide-react';
import { COLORS } from '@/theme/themeConstants';
import { materialService, courseService } from '@/services/apiService';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      fetchMaterials(selectedCourse);
    } else {
      setMaterials([]); // Or fetch from all courses if endpoint exists
      setLoading(false);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await courseService.getTeacherCourses();
      setCourses(Array.isArray(res) ? res : []);
      if (res && res.length > 0) {
        setSelectedCourse(res[0].id || res[0].ID);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMaterials = async (courseId) => {
    try {
      setLoading(true);
      const res = await materialService.getMaterialsByCourse(courseId);
      setMaterials(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this material?')) {
      try {
        await materialService.deleteMaterial(id);
        setMaterials(materials.filter(m => (m.id || m.ID) !== id));
      } catch (error) {
        alert('Failed to delete material');
      }
    }
  };

  const handleCreate = async () => {
    const title = prompt('Enter material title:');
    if (!title) return;
    const fileUrl = prompt('Enter material URL (e.g., Google Drive link):');
    if (!fileUrl) return;

    try {
      const newMaterial = await materialService.createMaterial({
        title,
        description: 'Uploaded material',
        file_type: 'link',
        file_url: fileUrl,
        course_id: parseInt(selectedCourse)
      });
      setMaterials([...materials, newMaterial.material || newMaterial]);
    } catch (error) {
      alert('Failed to create material');
    }
  };

  const filteredMaterials = materials.filter(m => 
    (m.title || m.Title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary }}>Learning Materials</h1>
          <p className="text-gray-600">Upload and manage course materials</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={selectedCourse === 'all'}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors hover:shadow-lg disabled:opacity-50"
          style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
        >
          <Plus size={20} />
          Upload Material
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary appearance-none bg-white min-w-[200px]"
          >
            <option value="all">Select a Course</option>
            {courses.map((course) => (
              <option key={course.id || course.ID} value={course.id || course.ID}>
                {course.name || course.title || course.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No materials found</h3>
          <p className="text-gray-500">Select a course and upload materials to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id || material.ID} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.secondary}15` }}>
                  {material.file_type === 'link' ? (
                    <LinkIcon size={24} style={{ color: COLORS.secondary }} />
                  ) : (
                    <File size={24} style={{ color: COLORS.secondary }} />
                  )}
                </div>
                <button onClick={() => handleDelete(material.id || material.ID)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="font-semibold text-lg mb-1">{material.title || material.Title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{material.description || material.Description}</p>
              <a
                href={material.file_url || material.FileURL}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium hover:underline flex items-center gap-1"
                style={{ color: COLORS.primary }}
              >
                View Material <LinkIcon size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
