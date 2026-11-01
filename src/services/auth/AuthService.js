import apiInstance, { EndPoints } from "@/api/apiInstance";

export const AuthService = {
  getTeacherProfile: async () => {
    try {
      const response = await apiInstance.get(EndPoints.TEACHER_PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
}; 
