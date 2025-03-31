import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { 
  Info, 
  PlusCircle, 
  Trash2, 
  HelpCircle, 
  Calendar, 
  AlertCircle, 
  Link as LinkIcon,
  ArrowUpRight,
  Globe
} from 'lucide-react';
import { DevelopmentStage, ProductStage, FundingStage } from '@/types/listings';
import { cn, formatCurrency } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

/**
 * StartupForm - Handles the Startup-specific fields (Step 3 in listing creation)
 * 
 * This component implements all fields according to the Business Options Platform specifications
 * for startup listings, including validation and conditional fields.
 */
const StartupForm = ({ submitAttempted = false, editMode = false }) => {
  const { 
    control, 
    register, 
    watch, 
    formState: { errors }, 
    setValue, 
    getValues, 
    trigger 
  } = useFormContext();

  // Use field array for repeating founder fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "startupDetails.team.founders"
  });

  // Watch values for conditional fields
  const developmentStage = watch("startupDetails.developmentStage");
  const teamSize = watch("startupDetails.team.teamSize");

  // Initialize founders array if empty
  useEffect(() => {
    if (fields.length === 0) {
      append({ name: '', role: '', experience: '' });
    }
  }, [fields, append]);
  
  // Calculate minimum allowed number of founders based on team size
  // At least 1 founder is required, but can't have more founders than team size
  const minFounders = 1;
  const maxFounders = teamSize ? Math.max(teamSize, minFounders) : 10;

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start">
        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Startup Information</p>
          <p>
            Complete this form with your startup's key details. All fields marked with an asterisk (*) are required.
            This information will help potential investors evaluate your startup.
          </p>
        </div>
      </div>

      {/* Startup Information Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Startup Information</h3>
          <p className="text-sm text-gray-500">Provide basic information about your startup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Development Stage */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="developmentStage" className="block text-sm font-semibold text-gray-800 mr-2">
                Development Stage <span className="text-red-500">*</span>
              </label>
              <Tooltip content="This helps investors understand your current growth phase">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <select
                id="developmentStage"
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.developmentStage ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.developmentStage", { 
                  required: "Development stage is required" 
                })}
              >
                <option value="">Select Stage</option>
                {Object.values(DevelopmentStage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {errors.startupDetails?.developmentStage && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.startupDetails?.developmentStage ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.developmentStage.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                This helps investors understand your current growth phase
              </p>
            )}
          </div>

          {/* Registered Name */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="registeredName" className="block text-sm font-semibold text-gray-800 mr-2">
                Registered Name <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The official registered name of your company">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <input
                type="text"
                id="registeredName"
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.registeredName ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.registeredName", { 
                  required: "Registered name is required",
                  minLength: { value: 3, message: "Name must be at least 3 characters" },
                  maxLength: { value: 100, message: "Name cannot exceed 100 characters" }
                })}
                placeholder="Legal entity name"
              />
              {errors.startupDetails?.registeredName && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.startupDetails?.registeredName ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.registeredName.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                The official registered name of your company
              </p>
            )}
          </div>

          {/* Founded Date */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="foundedDate" className="block text-sm font-semibold text-gray-800 mr-2">
                Founded Date <span className="text-red-500">*</span>
              </label>
              <Tooltip content="When your startup was officially established">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <Controller
                control={control}
                name="startupDetails.foundedDate"
                rules={{ required: "Foundation date is required" }}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      type="date"
                      id="foundedDate"
                      className={cn(
                        "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.startupDetails?.foundedDate ? "border-red-300" : "border-gray-300"
                      )}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        field.onChange(date);
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Calendar className={cn(
                        "h-5 w-5 text-gray-400", 
                        errors.startupDetails?.foundedDate && "text-red-500"
                      )} />
                    </div>
                  </div>
                )}
              />
            </div>
            {errors.startupDetails?.foundedDate ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.foundedDate.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                When your startup was officially established
              </p>
            )}
          </div>

          {/* Launch Date - Optional */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="launchDate" className="block text-sm font-semibold text-gray-800 mr-2">
                Launch Date <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="When your product was/will be launched to market (if applicable)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <Controller
                control={control}
                name="startupDetails.launchDate"
                render={({ field }) => (
                  <div className="relative">
                    <input
                      type="date"
                      id="launchDate"
                      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        field.onChange(date);
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              When your product was/will be launched to market (if applicable)
            </p>
          </div>

          {/* Mission Statement */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="missionStatement" className="block text-sm font-semibold text-gray-800 mr-2">
                Mission Statement <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Your startup's core purpose and philosophy">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="missionStatement"
                rows={2}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.missionStatement ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.missionStatement", { 
                  required: "Mission statement is required",
                  minLength: { value: 50, message: "Mission statement must be at least 50 characters" },
                  maxLength: { value: 300, message: "Mission statement cannot exceed 300 characters" }
                })}
                placeholder="Describe your startup's mission and purpose"
              />
              {errors.startupDetails?.missionStatement && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.missionStatement ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.missionStatement.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Your startup's core purpose and philosophy
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.missionStatement")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="problemStatement" className="block text-sm font-semibold text-gray-800 mr-2">
                Problem Statement <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The specific problem your startup is trying to solve">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="problemStatement"
                rows={2}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.problemStatement ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.problemStatement", { 
                  required: "Problem statement is required",
                  minLength: { value: 50, message: "Problem statement must be at least 50 characters" },
                  maxLength: { value: 300, message: "Problem statement cannot exceed 300 characters" }
                })}
                placeholder="What market gap or pain point are you addressing?"
              />
              {errors.startupDetails?.problemStatement && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.problemStatement ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.problemStatement.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  The specific problem your startup is trying to solve
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.problemStatement")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Solution Description */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="solutionDescription" className="block text-sm font-semibold text-gray-800 mr-2">
                Solution Description <span className="text-red-500">*</span>
              </label>
              <Tooltip content="A clear explanation of your solution approach and methodology">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="solutionDescription"
                rows={3}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.solutionDescription ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.solutionDescription", { 
                  required: "Solution description is required",
                  minLength: { value: 100, message: "Solution description must be at least 100 characters" },
                  maxLength: { value: 500, message: "Solution description cannot exceed 500 characters" }
                })}
                placeholder="How does your solution address the problem?"
              />
              {errors.startupDetails?.solutionDescription && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.solutionDescription ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.solutionDescription.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  A clear explanation of your solution approach and methodology
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.solutionDescription")?.length || 0}/500 characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team & Product Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team & Product</h3>
          <p className="text-sm text-gray-500">Details about your team, founders, and product</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Size */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="teamSize" className="block text-sm font-semibold text-gray-800 mr-2">
                Team Size <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The total number of people on your team">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                id="teamSize"
                min="1"
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.team?.teamSize ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.team.teamSize", { 
                  required: "Team size is required",
                  min: { value: 1, message: "Team size must be at least 1" },
                  max: { value: 100, message: "Team size must be less than 100" },
                  valueAsNumber: true
                })}
                placeholder="Number of team members"
              />
              {errors.startupDetails?.team?.teamSize && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.startupDetails?.team?.teamSize ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.team.teamSize.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                The total number of people on your team
              </p>
            )}
          </div>

          {/* Product Stage */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="productStage" className="block text-sm font-semibold text-gray-800 mr-2">
                Product Stage <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The current development status of your product">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <select
                id="productStage"
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.team?.productStage ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.team.productStage", { 
                  required: "Product stage is required" 
                })}
              >
                <option value="">Select Product Stage</option>
                {Object.values(ProductStage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {errors.startupDetails?.team?.productStage && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.startupDetails?.team?.productStage ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.team.productStage.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                The current development status of your product
              </p>
            )}
          </div>

          {/* Intellectual Property - Optional Multi-select */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label className="block text-sm font-semibold text-gray-800 mr-2">
                Intellectual Property <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Select any IP protections your startup currently has">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mt-1">
              {["Patents", "Trademarks", "Copyrights", "Trade Secrets"].map((ip) => (
                <div key={ip} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`ip-${ip}`}
                    value={ip.toLowerCase().replace(' ', '_')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register("startupDetails.team.intellectualProperty")}
                  />
                  <label htmlFor={`ip-${ip}`} className="ml-2 block text-sm text-gray-700">
                    {ip}
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select any IP protections your startup currently has
            </p>
          </div>

          {/* Technology Stack - Optional */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="technologyStack" className="block text-sm font-semibold text-gray-800 mr-2">
                Technology Stack <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="The primary technologies and frameworks your product is built on">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <textarea
              id="technologyStack"
              rows={2}
              className="block w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("startupDetails.team.technologyStack")}
              placeholder="Key technologies, languages, and frameworks used"
            />
            <p className="mt-1 text-xs text-gray-500">
              The primary technologies and frameworks your product is built on
            </p>
          </div>

          {/* Unique Selling Points */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="uniqueSellingPoints" className="block text-sm font-semibold text-gray-800 mr-2">
                Unique Selling Points <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Your key differentiators and competitive advantages">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="uniqueSellingPoints"
                rows={3}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.team?.uniqueSellingPoints ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.team.uniqueSellingPoints", { 
                  required: "Unique selling points are required",
                  minLength: { value: 100, message: "Unique selling points must be at least 100 characters" },
                  maxLength: { value: 500, message: "Unique selling points cannot exceed 500 characters" }
                })}
                placeholder="What makes your solution unique compared to alternatives?"
              />
              {errors.startupDetails?.team?.uniqueSellingPoints && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.team?.uniqueSellingPoints ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.team.uniqueSellingPoints.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Your key differentiators and competitive advantages
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.team.uniqueSellingPoints")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Founders - Repeatable Fields Section */}
          <div className="col-span-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <label className="block text-sm font-semibold text-gray-800 mr-2">
                  Founders <span className="text-red-500">*</span>
                </label>
                <Tooltip content="Key people who founded the startup. At least one founder is required.">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Tooltip>
              </div>
              {fields.length < maxFounders && (
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 focus:outline-none"
                  onClick={() => append({ name: '', role: '', experience: '' })}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Founder
                </button>
              )}
            </div>

            {errors.startupDetails?.team?.founders && (
              <p className="mt-1 mb-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.team.founders.message}
              </p>
            )}

            {fields.length === 0 && (
              <div className="text-center border rounded-md py-6 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">
                  No founders added. Click "Add Founder" to add details.
                </p>
              </div>
            )}

            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="border rounded-md p-4 mb-4 bg-gray-50 relative"
              >
                <div className="absolute top-4 right-4">
                  {fields.length > minFounders && (
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <h4 className="font-medium text-sm mb-3">Founder {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Founder Name */}
                  <div>
                    <label htmlFor={`founder-name-${index}`} className="block text-sm font-semibold text-gray-800 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`founder-name-${index}`}
                      className={cn(
                        "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.startupDetails?.team?.founders?.[index]?.name ? "border-red-300" : "border-gray-300"
                      )}
                      {...register(`startupDetails.team.founders.${index}.name`, { 
                        required: "Founder name is required" 
                      })}
                      placeholder="Founder name"
                    />
                    {errors.startupDetails?.team?.founders?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        {errors.startupDetails.team.founders[index].name.message}
                      </p>
                    )}
                  </div>

                  {/* Founder Role */}
                  <div>
                    <label htmlFor={`founder-role-${index}`} className="block text-sm font-semibold text-gray-800 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`founder-role-${index}`}
                      className={cn(
                        "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.startupDetails?.team?.founders?.[index]?.role ? "border-red-300" : "border-gray-300"
                      )}
                      {...register(`startupDetails.team.founders.${index}.role`, { 
                        required: "Founder role is required" 
                      })}
                      placeholder="e.g., CEO, CTO"
                    />
                    {errors.startupDetails?.team?.founders?.[index]?.role && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        {errors.startupDetails.team.founders[index].role.message}
                      </p>
                    )}
                  </div>

                  {/* Founder Experience */}
                  <div className="md:col-span-2">
                    <label htmlFor={`founder-experience-${index}`} className="block text-sm font-semibold text-gray-800 mb-1">
                      Experience <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id={`founder-experience-${index}`}
                      rows={2}
                      className={cn(
                        "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.startupDetails?.team?.founders?.[index]?.experience ? "border-red-300" : "border-gray-300"
                      )}
                      {...register(`startupDetails.team.founders.${index}.experience`, { 
                        required: "Founder experience is required",
                        minLength: { value: 50, message: "Experience must be at least 50 characters" },
                        maxLength: { value: 300, message: "Experience cannot exceed 300 characters" }
                      })}
                      placeholder="Relevant professional background and experience"
                    />
                    <div className="flex justify-between mt-1">
                      {errors.startupDetails?.team?.founders?.[index]?.experience ? (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          {errors.startupDetails.team.founders[index].experience.message}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Brief description of relevant background</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {watch(`startupDetails.team.founders.${index}.experience`)?.length || 0}/300
                      </p>
                    </div>
                  </div>

                  {/* LinkedIn Profile - Optional */}
                  <div className="md:col-span-2">
                    <label htmlFor={`founder-linkedin-${index}`} className="block text-sm font-semibold text-gray-800 mb-1">
                      LinkedIn Profile <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id={`founder-linkedin-${index}`}
                        className={cn(
                          "block w-full pl-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                          errors.startupDetails?.team?.founders?.[index]?.linkedinProfile ? "border-red-300" : "border-gray-300"
                        )}
                        {...register(`startupDetails.team.founders.${index}.linkedinProfile`, { 
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
                            message: "Please enter a valid LinkedIn profile URL"
                          }
                        })}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                    {errors.startupDetails?.team?.founders?.[index]?.linkedinProfile && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        {errors.startupDetails.team.founders[index].linkedinProfile.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Warning if max founders reached */}
            {fields.length >= maxFounders && (
              <p className="mt-2 text-sm text-amber-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Maximum number of founders reached. Please update your team size if needed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Market & Traction Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Market & Traction</h3>
          <p className="text-sm text-gray-500">Information about your market, users, and business metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User metrics fields - conditional based on development stage */}
          {developmentStage && developmentStage !== DevelopmentStage.IDEA && (
            <>
              {/* Total Users - Required for post-MVP */}
              <div className="col-span-1">
                <div className="flex items-center">
                  <label htmlFor="totalUsers" className="block text-sm font-semibold text-gray-800 mr-2">
                    Total Users {developmentStage !== DevelopmentStage.MVP ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}
                  </label>
                  <Tooltip content="The total number of users who have signed up">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Tooltip>
                </div>
                <div className="relative mt-1">
                  <input
                    type="number"
                    id="totalUsers"
                    min="0"
                    className={cn(
                      "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.startupDetails?.market?.totalUsers ? "border-red-300" : "border-gray-300"
                    )}
                    {...register("startupDetails.market.totalUsers", {
                      ...(developmentStage !== DevelopmentStage.MVP && { required: "Total users is required for your stage" }),
                      min: { value: 0, message: "Total users cannot be negative" },
                      valueAsNumber: true
                    })}
                    placeholder="Number of users"
                  />
                  {errors.startupDetails?.market?.totalUsers && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {errors.startupDetails?.market?.totalUsers ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {errors.startupDetails.market.totalUsers.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    The total number of users who have signed up
                  </p>
                )}
              </div>

              {/* Active Users - Required for post-MVP */}
              <div className="col-span-1">
                <div className="flex items-center">
                  <label htmlFor="activeUsers" className="block text-sm font-semibold text-gray-800 mr-2">
                    Active Users {developmentStage !== DevelopmentStage.MVP ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}
                  </label>
                  <Tooltip content="Users who actively engage with your product">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Tooltip>
                </div>
                <div className="relative mt-1">
                  <input
                    type="number"
                    id="activeUsers"
                    min="0"
                    className={cn(
                      "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.startupDetails?.market?.activeUsers ? "border-red-300" : "border-gray-300"
                    )}
                    {...register("startupDetails.market.activeUsers", {
                      ...(developmentStage !== DevelopmentStage.MVP && { required: "Active users is required for your stage" }),
                      min: { value: 0, message: "Active users cannot be negative" },
                      validate: {
                        notMoreThanTotal: value => {
                          const totalUsers = watch("startupDetails.market.totalUsers");
                          return !totalUsers || !value || value <= totalUsers || "Active users cannot be more than total users";
                        }
                      },
                      valueAsNumber: true
                    })}
                    placeholder="Number of active users"
                  />
                  {errors.startupDetails?.market?.activeUsers && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {errors.startupDetails?.market?.activeUsers ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {errors.startupDetails.market.activeUsers.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Users who actively engage with your product
                  </p>
                )}
              </div>
            </>
          )}

          {/* Revenue Model */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="revenueModel" className="block text-sm font-semibold text-gray-800 mr-2">
                Revenue Model <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Explain your monetization approach (e.g., subscription, freemium, marketplace)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="revenueModel"
                rows={2}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.market?.revenueModel ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.market.revenueModel", { 
                  required: "Revenue model is required",
                  minLength: { value: 50, message: "Revenue model must be at least 50 characters" },
                  maxLength: { value: 300, message: "Revenue model cannot exceed 300 characters" }
                })}
                placeholder="How does or will your startup generate revenue?"
              />
              {errors.startupDetails?.market?.revenueModel && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.market?.revenueModel ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.market.revenueModel.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Explain your monetization approach (e.g., subscription, freemium, marketplace)
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.market.revenueModel")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Monthly Revenue - Conditional for post-launch */}
          {developmentStage && ['seed', 'series_a', 'series_b_plus'].includes(developmentStage) && (
            <div className="col-span-1">
              <div className="flex items-center">
                <label htmlFor="monthlyRevenue" className="block text-sm font-semibold text-gray-800 mr-2">
                  Monthly Revenue <span className="text-red-500">*</span>
                </label>
                <Tooltip content="This information helps investors understand your current traction and revenue potential">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Tooltip>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <Controller
                  control={control}
                  name="startupDetails.market.monthlyRevenue.value"
                  rules={{
                    required: "Monthly revenue is required for your stage"
                  }}
                  render={({ field }) => (
                    <input
                      type="number"
                      id="monthlyRevenue"
                      className={cn(
                        "block w-full pl-10 pr-12 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                        errors.startupDetails?.market?.monthlyRevenue?.value ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="Enter amount"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber || 0);
                        // Also update the formatted value
                        const formattedValue = e.target.valueAsNumber 
                          ? formatCurrency(e.target.valueAsNumber, 'INR') 
                          : '';
                        setValue("startupDetails.market.monthlyRevenue.formatted", formattedValue);
                      }}
                    />
                  )}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
              {errors.startupDetails?.market?.monthlyRevenue?.value ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.market.monthlyRevenue.value.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Your current monthly revenue
                </p>
              )}
            </div>
          )}

          {/* Growth Rate - Optional */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="growthRate" className="block text-sm font-semibold text-gray-800 mr-2">
                Growth Rate <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Monthly or quarterly user/revenue growth rate">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                id="growthRate"
                min="0"
                max="1000"
                className="block w-full pr-12 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                {...register("startupDetails.market.growthRate", { 
                  min: { value: 0, message: "Growth rate cannot be negative" },
                  max: { value: 1000, message: "Growth rate cannot exceed 1000%" },
                  valueAsNumber: true
                })}
                placeholder="0"
                aria-describedby="growthRate-description"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            {errors.startupDetails?.market?.growthRate ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.market.growthRate.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500" id="growthRate-description">
                Monthly or quarterly user/revenue growth rate
              </p>
            )}
          </div>

          {/* Target Market */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="targetMarket" className="block text-sm font-semibold text-gray-800 mr-2">
                Target Market <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Detailed description of your target customer segment">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="targetMarket"
                rows={2}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.market?.targetMarket ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.market.targetMarket", { 
                  required: "Target market is required",
                  minLength: { value: 50, message: "Target market must be at least 50 characters" },
                  maxLength: { value: 300, message: "Target market cannot exceed 300 characters" }
                })}
                placeholder="Describe your ideal customer profile and target audience"
              />
              {errors.startupDetails?.market?.targetMarket && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.market?.targetMarket ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.market.targetMarket.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Detailed description of your target customer segment
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.market.targetMarket")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Market Size (TAM) */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="marketSize" className="block text-sm font-semibold text-gray-800 mr-2">
                Market Size (TAM) <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Total Addressable Market (TAM) is the total market demand for your product or service. This should be a realistic, research-based figure.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="startupDetails.market.marketSize.value"
                rules={{
                  required: "Market size is required"
                }}
                render={({ field }) => (
                  <input
                    type="number"
                    id="marketSize"
                    className={cn(
                      "block w-full pl-7 pr-12 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.startupDetails?.market?.marketSize?.value ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("startupDetails.market.marketSize.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            {errors.startupDetails?.market?.marketSize?.value ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.market.marketSize.value.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Total addressable market size in INR
              </p>
            )}
          </div>

          {/* Competitive Analysis */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="competitiveAnalysis" className="block text-sm font-semibold text-gray-800 mr-2">
                Competitive Analysis <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Key competitors and your unique positioning against them">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="competitiveAnalysis"
                rows={3}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.market?.competitiveAnalysis ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.market.competitiveAnalysis", { 
                  required: "Competitive analysis is required",
                  minLength: { value: 100, message: "Competitive analysis must be at least 100 characters" },
                  maxLength: { value: 500, message: "Competitive analysis cannot exceed 500 characters" }
                })}
                placeholder="Who are your key competitors and how do you differentiate from them?"
              />
              {errors.startupDetails?.market?.competitiveAnalysis && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.market?.competitiveAnalysis ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.market.competitiveAnalysis.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Key competitors and your unique positioning against them
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.market.competitiveAnalysis")?.length || 0}/500 characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Information Section */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Funding Information</h3>
          <p className="text-sm text-gray-500">Details about your fundraising needs and financial projections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Funding Stage */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="fundingStage" className="block text-sm font-semibold text-gray-800 mr-2">
                Funding Stage <span className="text-red-500">*</span>
              </label>
              <Tooltip content="The investment phase you're currently targeting">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <select
                id="fundingStage"
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.funding?.fundingStage ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.funding.fundingStage", { 
                  required: "Funding stage is required" 
                })}
              >
                <option value="">Select Funding Stage</option>
                {Object.values(FundingStage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {errors.startupDetails?.funding?.fundingStage && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.startupDetails?.funding?.fundingStage ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.funding.fundingStage.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                The investment phase you're currently targeting
              </p>
            )}
          </div>

          {/* Total Raised to Date - Optional */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="totalRaisedToDate" className="block text-sm font-semibold text-gray-800 mr-2">
                Total Raised to Date <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Total funding received from all sources so far">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="startupDetails.funding.totalRaisedToDate.value"
                render={({ field }) => (
                  <input
                    type="number"
                    id="totalRaisedToDate"
                    className="block w-full pl-7 pr-12 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("startupDetails.funding.totalRaisedToDate.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Total funding received from all sources so far
            </p>
          </div>

          {/* Current Raising Amount */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="currentRaisingAmount" className="block text-sm font-semibold text-gray-800 mr-2">
                Current Raising Amount <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Amount you're currently seeking to raise">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="startupDetails.funding.currentRaisingAmount.value"
                rules={{
                  required: "Raising amount is required"
                }}
                render={({ field }) => (
                  <input
                    type="number"
                    id="currentRaisingAmount"
                    className={cn(
                      "block w-full pl-7 pr-12 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.startupDetails?.funding?.currentRaisingAmount?.value ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("startupDetails.funding.currentRaisingAmount.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            {errors.startupDetails?.funding?.currentRaisingAmount?.value ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.funding.currentRaisingAmount.value.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Amount you're currently seeking to raise
              </p>
            )}
          </div>

          {/* Equity Offered */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="equityOffered" className="block text-sm font-semibold text-gray-800 mr-2">
                Equity Offered <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Percentage of equity offered for the investment">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                id="equityOffered"
                min="0.1"
                max="100"
                step="0.1"
                className={cn(
                  "block w-full pr-12 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.funding?.equityOffered ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.funding.equityOffered", { 
                  required: "Equity offered is required",
                  min: { value: 0.1, message: "Equity offered must be at least 0.1%" },
                  max: { value: 100, message: "Equity offered cannot exceed 100%" },
                  valueAsNumber: true
                })}
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            {errors.startupDetails?.funding?.equityOffered ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.funding.equityOffered.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Percentage of equity offered for the investment
              </p>
            )}
          </div>

          {/* Pre-money Valuation */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="preMoneyValuation" className="block text-sm font-semibold text-gray-800 mr-2">
                Pre-money Valuation <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Pre-money valuation is the value of your company before the investment. This should be consistent with your equity offered and raising amount.">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="startupDetails.funding.preMoneyValuation.value"
                rules={{
                  required: "Pre-money valuation is required",
                  validate: {
                    consistentWithEquity: value => {
                      const raisingAmount = watch("startupDetails.funding.currentRaisingAmount.value") || 0;
                      const equityOffered = watch("startupDetails.funding.equityOffered") || 0;
                      
                      if (!value || !equityOffered) return true;
                      
                      // The formula for pre-money valuation is:
                      // pre-money valuation = (raising amount / equity offered) * (100 - equity offered)
                      // We'll allow some flexibility (±10%) as founders might round numbers
                      const expectedVal = (raisingAmount / equityOffered) * (100 - equityOffered);
                      const lowerBound = expectedVal * 0.9;
                      const upperBound = expectedVal * 1.1;
                      
                      return (value >= lowerBound && value <= upperBound) || 
                             "Valuation should be consistent with equity offered and raising amount";
                    }
                  }
                }}
                render={({ field }) => (
                  <input
                    type="number"
                    id="preMoneyValuation"
                    className={cn(
                      "block w-full pl-7 pr-12 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                      errors.startupDetails?.funding?.preMoneyValuation?.value ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("startupDetails.funding.preMoneyValuation.formatted", formattedValue);
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            {errors.startupDetails?.funding?.preMoneyValuation?.value ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.funding.preMoneyValuation.value.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Company valuation before the investment
              </p>
            )}
          </div>

          {/* Use of Funds */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="useOfFunds" className="block text-sm font-semibold text-gray-800 mr-2">
                Use of Funds <span className="text-red-500">*</span>
              </label>
              <Tooltip content="Detailed breakdown of how the funds will be allocated">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <textarea
                id="useOfFunds"
                rows={3}
                className={cn(
                  "block w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.funding?.useOfFunds ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.funding.useOfFunds", { 
                  required: "Use of funds is required",
                  minLength: { value: 100, message: "Use of funds must be at least 100 characters" },
                  maxLength: { value: 500, message: "Use of funds cannot exceed 500 characters" }
                })}
                placeholder="How will you use the funds being raised? Be specific with allocation percentages."
              />
              {errors.startupDetails?.funding?.useOfFunds && (
                <div className="absolute top-0 right-0 flex items-center pr-3 pt-3 pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.funding?.useOfFunds ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.funding.useOfFunds.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Detailed breakdown of how the funds will be allocated
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.funding.useOfFunds")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          {/* Previous Investors - Optional */}
          <div className="col-span-full">
            <div className="flex items-center">
              <label htmlFor="previousInvestors" className="block text-sm font-semibold text-gray-800 mr-2">
                Previous Investors <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="List notable investors with their permission">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <textarea
              id="previousInvestors"
              rows={2}
              className="block w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
              {...register("startupDetails.funding.previousInvestors", {
                maxLength: { value: 300, message: "Previous investors cannot exceed 300 characters" }
              })}
              placeholder="Notable investors who have already backed your startup"
            />
            <div className="flex justify-between mt-1">
              {errors.startupDetails?.funding?.previousInvestors ? (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {errors.startupDetails.funding.previousInvestors.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  List notable investors with their permission
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watch("startupDetails.funding.previousInvestors")?.length || 0}/300 characters
              </p>
            </div>
          </div>

          {/* Financial metrics - Optional fields */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="burnRate" className="block text-sm font-semibold text-gray-800 mr-2">
                Monthly Burn Rate <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Your monthly expenses">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Controller
                control={control}
                name="startupDetails.funding.burnRate.value"
                render={({ field }) => (
                  <input
                    type="number"
                    id="burnRate"
                    className="block w-full pl-7 pr-12 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                    placeholder="0"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      // Also update the formatted value
                      const formattedValue = e.target.valueAsNumber 
                        ? formatCurrency(e.target.valueAsNumber, 'INR') 
                        : '';
                      setValue("startupDetails.funding.burnRate.formatted", formattedValue);
                      
                      // Update runway calculation if both values are set
                      const cash = getValues("startupDetails.funding.totalRaisedToDate.value");
                      if (cash && e.target.valueAsNumber) {
                        const runwayMonths = Math.floor(cash / e.target.valueAsNumber);
                        setValue("startupDetails.funding.runway", runwayMonths);
                      }
                    }}
                  />
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your monthly expenses
            </p>
          </div>

          {/* Runway */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="runway" className="block text-sm font-semibold text-gray-800 mr-2">
                Runway <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Months remaining at current burn rate">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <input
                type="number"
                id="runway"
                min="0"
                max="60"
                className="block w-full pr-16 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                {...register("startupDetails.funding.runway", { 
                  min: { value: 0, message: "Runway cannot be negative" },
                  max: { value: 60, message: "Runway cannot exceed 60 months" },
                  valueAsNumber: true
                })}
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">months</span>
              </div>
            </div>
            {errors.startupDetails?.funding?.runway ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.funding.runway.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Months remaining at current burn rate
              </p>
            )}
          </div>
        </div>
      </div>

      {/* External Links (Optional) */}
      <div className="card border border-gray-200 bg-white rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">External Links</h3>
          <p className="text-sm text-gray-500">Provide additional information about your startup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Website */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="startupWebsite" className="block text-sm font-semibold text-gray-800 mr-2">
                Website <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Your startup's official website">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Globe className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="startupWebsite"
                className={cn(
                  "block w-full pl-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.links?.website ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.links.website", { 
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w-]*)*\/?$/,
                    message: "Please enter a valid URL"
                  }
                })}
                placeholder="https://www.example.com"
              />
            </div>
            {errors.startupDetails?.links?.website ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.links.website.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Your startup's official website
              </p>
            )}
          </div>

          {/* Pitch Deck */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="pitchDeck" className="block text-sm font-semibold text-gray-800 mr-2">
                Pitch Deck URL <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Link to your investor presentation (e.g., Google Slides, SlideShare)">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="pitchDeck"
                className={cn(
                  "block w-full pl-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors",
                  errors.startupDetails?.links?.pitchDeck ? "border-red-300" : "border-gray-300"
                )}
                {...register("startupDetails.links.pitchDeck", { 
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w-]*)*\/?$/,
                    message: "Please enter a valid URL"
                  }
                })}
                placeholder="https://docs.google.com/presentation/..."
              />
            </div>
            {errors.startupDetails?.links?.pitchDeck ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {errors.startupDetails.links.pitchDeck.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Link to your investor presentation
              </p>
            )}
          </div>

          {/* Social Media Links */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="socialMedia" className="block text-sm font-semibold text-gray-800 mr-2">
                Social Media <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Link to your primary social media account">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="socialMedia"
                className="block w-full pl-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                {...register("startupDetails.links.socialMedia")}
                placeholder="https://twitter.com/yourstartup"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your primary social media account
            </p>
          </div>

          {/* Product Demo */}
          <div className="col-span-1">
            <div className="flex items-center">
              <label htmlFor="productDemo" className="block text-sm font-semibold text-gray-800 mr-2">
                Product Demo <span className="text-gray-400">(Optional)</span>
              </label>
              <Tooltip content="Link to a video or interactive demo of your product">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </div>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                id="productDemo"
                className="block w-full pl-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0031ac] focus:border-[#0031ac] transition-colors"
                {...register("startupDetails.links.productDemo")}
                placeholder="https://youtube.com/..."
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Link to a video or interactive demo of your product
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupForm;