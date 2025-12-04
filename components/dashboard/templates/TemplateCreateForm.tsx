"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { showToast } from "@/lib/utils/toast";
import { createTemplate } from "@/lib/services/templatesService";
import dynamic from "next/dynamic";

const DragDropCheckbox = dynamic(
  () => import("@/components/form/DragDropCheckbox"),
  {
    ssr: false,
  }
);

const templateSchema: yup.ObjectSchema<TemplateFormData> = yup
  .object({
    title: yup.string().required("Template Title is required"),
    package: yup.string().required("Package is required"),
  })
  .required();

export interface TemplateCreateFormProps {
  packages: any[];
}

interface TemplateFormData {
  title: string;
  package: string;
}

export default function TemplateCreateForm({
  packages,
}: TemplateCreateFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allBouquets, setAllBouquets] = useState<any[]>([]);
  const [selectedBouquets, setSelectedBouquets] = useState<number[]>([]);
  const [newOrderLive, setNewOrderLive] = useState<number[]>([]);
  const [newOrderVod, setNewOrderVod] = useState<number[]>([]);
  const [newOrderSeries, setNewOrderSeries] = useState<number[]>([]);

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultValues = useMemo(
    () => ({
      title: "",
      package: "",
    }),
    []
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: yupResolver(templateSchema),
    defaultValues,
  });

  const selectedPackageId = watch("package");
  const availablePackages = useMemo(() => packages ?? [], [packages]);

  useEffect(() => {
    if (!mounted) return;

    if (!selectedPackageId) {
      setAllBouquets([]);
      return;
    }

    // Find package - handle both string and number comparison
    const foundPackage = availablePackages.find((pkg) => {
      const pkgId = pkg?.id;
      const searchId = selectedPackageId?.toString();

      // Try multiple comparison methods
      return (
        String(pkgId) === String(searchId) ||
        Number(pkgId) === Number(searchId) ||
        pkgId?.toString() === searchId?.toString()
      );
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Package lookup:", {
        selectedPackageId,
        selectedPackageIdType: typeof selectedPackageId,
        availablePackagesCount: availablePackages.length,
        packageIds: availablePackages.map((p) => ({
          id: p.id,
          type: typeof p.id,
        })),
        foundPackage: foundPackage
          ? {
              id: foundPackage.id,
              name: foundPackage.package_name,
              hasBouquetsData: !!foundPackage.bouquetsdata,
              bouquetsCount: Array.isArray(foundPackage.bouquetsdata)
                ? foundPackage.bouquetsdata.length
                : 0,
            }
          : "NOT FOUND",
      });
    }

    if (
      foundPackage?.bouquetsdata &&
      Array.isArray(foundPackage.bouquetsdata) &&
      foundPackage.bouquetsdata.length > 0
    ) {
      setAllBouquets(foundPackage.bouquetsdata);
      setSelectedBouquets([]);
      setNewOrderLive([]);
      setNewOrderVod([]);
      setNewOrderSeries([]);
    } else {
      setAllBouquets([]);
    }
  }, [selectedPackageId, availablePackages, mounted]);

  const bouquets = useMemo(() => {
    if (!allBouquets || allBouquets.length === 0) {
      return { bouquetsLive: [], bouquetsVODS: [], bouquetsSeries: [] };
    }

    const bouquetsLive = allBouquets.filter(
      (x) =>
        x.bouquet_name?.toLowerCase().indexOf("vod") === -1 &&
        x.bouquet_name?.toLowerCase().indexOf("series") === -1
    );

    const bouquetsVODS = allBouquets.filter(
      (x) => x.bouquet_name?.toLowerCase().indexOf("vod") !== -1
    );
    const bouquetsSeries = allBouquets.filter(
      (x) => x.bouquet_name?.toLowerCase().indexOf("series") !== -1
    );

    return { bouquetsLive, bouquetsVODS, bouquetsSeries };
  }, [allBouquets]);

  const handleSelectedBouquet = useCallback((id: number) => {
    setSelectedBouquets((prev) => {
      const isAlreadySelected = prev.includes(id);
      return isAlreadySelected
        ? prev.filter((item) => item !== id)
        : [...prev, id];
    });
  }, []);

  const handleNewOrderLive = useCallback((newItems: any[]) => {
    setNewOrderLive(newItems.map((item) => item.id));
  }, []);

  const handleNewOrderVod = useCallback((newItems: any[]) => {
    setNewOrderVod(newItems.map((item) => item.id));
  }, []);

  const handleNewOrderSeries = useCallback((newItems: any[]) => {
    setNewOrderSeries(newItems.map((item) => item.id));
  }, []);

  const handleSelectAll = useCallback((items: any[]) => {
    const ids = items.map((item) => item.id);
    setSelectedBouquets((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const handleSelectNone = useCallback((items: any[]) => {
    const ids = new Set(items.map((item) => item.id));
    setSelectedBouquets((prev) => prev.filter((id) => !ids.has(id)));
  }, []);

  const onSubmit = async (data: TemplateFormData) => {
    console.log("Submitting form with data:", data);
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (selectedBouquets.length < 1) {
        showToast.error("You have to select at least one bouquet");
        return;
      }

      const arrayLive = [...newOrderLive];
      const arrayVod = [...newOrderVod];
      const arraySeries = [...newOrderSeries];

      if (newOrderLive.length < 1) {
        bouquets.bouquetsLive.forEach((item) => arrayLive.push(item.id));
      }

      if (newOrderVod.length < 1) {
        bouquets.bouquetsVODS.forEach((item) => arrayVod.push(item.id));
      }

      if (newOrderSeries.length < 1) {
        bouquets.bouquetsSeries.forEach((item) => arraySeries.push(item.id));
      }

      const allOrder = [...arrayLive, ...arrayVod, ...arraySeries];
      const selectedBouquetsOrder = allOrder.filter((item) =>
        selectedBouquets.includes(item)
      );

      const payload = {
        title: data.title,
        bouquets: JSON.stringify(selectedBouquetsOrder),
        new_order: JSON.stringify(allOrder),
        package: data.package,
      };

      console.log("Payload for template creation:", payload);
      const result = await createTemplate(payload);

      if (result?.success || result?.data?.success) {
        showToast.success(
          result?.data?.message ||
            result?.message ||
            "Template created successfully"
        );
        setSuccess("Template created successfully");
        router.push("/dashboard/templates/list");
        router.refresh();
      } else {
        const message =
          result?.error || result?.data?.error || "Unable to create template";
        showToast.error(message);
        setError(message);
      }
    } catch (error: any) {
      const message = error?.message || "An error occurred. Please try again.";
      showToast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Template Title"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="package"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.package}>
                      <InputLabel>Select Package</InputLabel>
                      <Select {...field} label="Select Package">
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {availablePackages.map((pkg) => (
                          <MenuItem key={pkg.id} value={String(pkg.id)}>
                            {pkg.package_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.package && (
                        <FormHelperText>
                          {errors.package.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {mounted && allBouquets.length > 0 && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {bouquets.bouquetsLive.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsLive}
                        title="LIVE"
                        handleNewOrder={handleNewOrderLive}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}

                    {bouquets.bouquetsVODS.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsVODS}
                        title="VOD"
                        handleNewOrder={handleNewOrderVod}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}

                    {bouquets.bouquetsSeries.length > 0 && (
                      <DragDropCheckbox
                        initial={bouquets.bouquetsSeries}
                        title="SERIES"
                        handleNewOrder={handleNewOrderSeries}
                        selected={selectedBouquets}
                        handleSelectAll={handleSelectAll}
                        handleSelectNone={handleSelectNone}
                        handleSelectedBouquet={handleSelectedBouquet}
                      />
                    )}
                  </Box>
                )}

                {mounted && selectedPackageId && allBouquets.length === 0 && (
                  <Alert severity="info">
                    No bouquets available for this package. Please select a
                    different package.
                  </Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Create Template"
                    )}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </form>
  );
}
