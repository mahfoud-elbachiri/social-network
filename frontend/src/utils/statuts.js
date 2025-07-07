
export const statuts = async () => {
  try {
    const response = await fetch('http://localhost:8080/statuts', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json();
    return data
  } catch (error) {
    console.error("Error fetching statuts:", error);
    return { error: true };
  }
}
