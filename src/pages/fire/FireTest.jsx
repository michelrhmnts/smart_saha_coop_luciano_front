import { useEffect } from "react";
import fireService from "../../services/fireService";

const FireTest = () => {
  useEffect(() => {
    const test = async () => {
      try {
        const result = await fireService.getNearbyFires(5);

        console.log("🔥 Feux proches :", result);
      } catch (error) {
        console.error(
          "❌ Erreur récupération feux :",
          error.response?.data || error.message
        );
      }
    };

    test();
  }, []);

  return (
    <div className="p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
      <h1 className="text-xl font-bold">Test détection des feux</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Consultez la console du navigateur pour les résultats.</p>
    </div>
  );
};

export default FireTest;