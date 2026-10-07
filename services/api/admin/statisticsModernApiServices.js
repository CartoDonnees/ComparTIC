import { userAxiosInstance } from "@/services/config/axiosConfig";

/**
 * Statistiques générales   version détaillée et filtrable.
 *
 * Service DISTINCT de `statisticsApiServices` : le tableau de bord historique
 * continue d'utiliser celui-ci sans changement, et cette page dispose de sa
 * propre agrégation, filtrable côté serveur.
 *
 * @param {{operatorIds?: number[], from?: string, to?: string,
 *          category?: string, billingType?: string, months?: number}} filters
 */
export const getModernStats = async (filters = {}) => {
  try {
    const { data } = await userAxiosInstance.post(
      "admin/statistics/generalStatisticsDetailed",
      {
        operatorIds: filters?.operatorIds,
        from: filters?.from,
        to: filters?.to,
        category: filters?.category,
        billingType: filters?.billingType,
        months: filters?.months,
        dateField: filters?.dateField,
      },
    );
    return data ?? null;
  } catch (error) {
    return null;
  }
};

export default getModernStats;
