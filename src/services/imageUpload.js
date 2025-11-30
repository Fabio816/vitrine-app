// services/imageUpload.js
export const imageUploadService = {
  async uploadImage(file, onProgress = null) {
    // Simulação de upload - em produção, você enviaria para seu servidor
    return new Promise((resolve, reject) => {
      // Simular progresso
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (onProgress) onProgress(progress);
        
        if (progress >= 90) {
          clearInterval(progressInterval);
          
          // Criar URL local para o arquivo (fallback)
          const objectUrl = URL.createObjectURL(file);
          resolve(objectUrl);
        }
      }, 100);
    });
  },

  async uploadToServer(file) {
    // Implementação para enviar para seu próprio servidor
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Erro no upload para servidor:', error);
      throw error;
    }
  }
};