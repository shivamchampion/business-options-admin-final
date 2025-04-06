import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, Calendar, HelpCircle } from 'lucide-react';
import Select from 'react-select';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

/**
 * FormField - A consistent form field component
 * 
 * This component provides standardized styling and error handling for form inputs,
 * selects, and textareas throughout the application.
 */
export const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  icon,
  tooltip,
  required = false,
  options = [],
  onChange,
  className = '',
  containerClassName = '',
  disabled = false,
  min,
  max,
  step,
  registerOptions = {},
  ...props
}) => {
  const { register, formState: { errors }, setValue, getValues, watch } = useFormContext();
  
  // Helper to access nested errors using dot notation
  const getNestedError = (errors, path) => {
    const parts = path.split('.');
    let current = errors;
    
    for (const part of parts) {
      if (!current[part]) return null;
      current = current[part];
    }
    
    return current;
  };
  
  // Get the error for this field
  const error = getNestedError(errors, name);
  
  // Format error message to be more user-friendly
  const formatErrorMessage = (error) => {
    if (!error || !error.message) return null;
    
    const message = error.message;
    
    // Handle specific types of validation errors
    if (message.includes("Expected string, received number")) {
      if (name.includes("phone")) {
        return "Please enter a valid phone number";
      }
      return "Invalid format";
    }
    
    return message;
  };
  
  // Get the formatted error message
  const errorMessage = formatErrorMessage(error);
  
  // Custom styles for react-select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#0031ac' : error ? '#fca5a5' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #0031ac' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0031ac' : '#9CA3AF'
      },
      backgroundColor: 'white'
    }),
    option: (base, state) => ({
      ...base,
      padding: '8px 12px',
      paddingLeft: icon ? '44px' : '12px',
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#0031ac' : state.isFocused ? '#E6EEFF' : 'white',
      color: state.isSelected ? 'white' : '#333333'
    }),
    placeholder: base => ({
      ...base,
      fontSize: '0.875rem',
      marginLeft: icon ? '32px' : '0',
      color: '#6B7280'
    }),
    singleValue: base => ({
      ...base,
      fontSize: '0.875rem',
      marginLeft: icon ? '32px' : '0'
    }),
    valueContainer: base => ({
      ...base,
      padding: '2px 12px'
    }),
    input: base => ({
      ...base,
      margin: '0',
      paddingTop: '2px',
      paddingBottom: '2px',
      marginLeft: icon ? '32px' : '0'
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 9999,
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '0.375rem'
    })
  };
  
  // Add CSS to prevent dropdown transparency issues
  const styles = `
    /* Ensure dropdown menus are completely opaque */
    .select__menu-portal {
      background-color: white !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    .select__menu {
      background-color: white !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    .select__menu-list {
      background-color: white !important;
    }
    
    .select__option {
      background-color: white !important;
    }
    
    .select__option--is-focused {
      background-color: #E6EEFF !important;
    }
    
    .select__option--is-selected {
      background-color: #0031ac !important;
    }

    /* Hide any icons that might appear in dropdown options */
    .select__menu-portal .absolute {
      display: none !important;
    }
  `;
  
  // Add the styles to the document
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  // Tooltip component
  const Tooltip = ({ content, children }) => {
    return (
      <div className="group relative inline-block">
        {children}
        <div className="absolute z-50 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
          transform -translate-x-1/2 left-1/2 bottom-full mb-2 transition-all duration-200 ease-in-out pointer-events-none">
          <div className="relative bg-gray-800 text-white text-xs rounded-md p-2 text-center shadow-lg">
            {content}
            <div className="absolute w-2.5 h-2.5 bg-gray-800 transform rotate-45 -bottom-[5px] left-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </div>
    );
  };
  
  // Register the field with react-hook-form
  const fieldProps = register(name, {
    required: required ? `${label} is required` : false,
    ...registerOptions
  });
  
  return (
    <div className={cn("mb-4", containerClassName)}>
      {/* Label with optional tooltip */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <label htmlFor={name} className="text-sm font-medium text-gray-800 flex-shrink-0">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {tooltip && (
          <Tooltip content={tooltip}>
            <div className="flex items-center">
              <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </Tooltip>
        )}
      </div>
      
      {/* Field rendering based on type */}
      {type === 'select' ? (
        <div className="relative select-wrapper">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-30">
              {icon}
            </div>
          )}
          
          <Select
            inputId={name}
            options={options}
            placeholder={placeholder}
            className={cn(className)}
            styles={selectStyles}
            onChange={(option) => {
              setValue(name, option.value);
              if (onChange) onChange(option);
            }}
            isDisabled={disabled}
            value={options.find(option => option.value === watch(name))}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            classNames={{
              control: (state) => cn(
                error ? 'border-red-300' : 'border-gray-300'
              )
            }}
          />
        </div>
      ) : type === 'textarea' ? (
        <div className="relative">
          {icon && (
            <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          
          <textarea
            id={name}
            className={cn(
              "block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-[#0031ac] focus:outline-none focus:ring-1 focus:ring-[#0031ac]",
              icon ? 'pl-10' : '',
              error ? 'border-red-300' : 'border-gray-300',
              className
            )}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            {...props}
            {...fieldProps}
          />
        </div>
      ) : type === 'number' ? (
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          
          <input
            id={name}
            type="number"
            className={cn(
              "block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-[#0031ac] focus:outline-none focus:ring-1 focus:ring-[#0031ac] pr-12",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              icon ? 'pl-10' : '',
              error ? 'border-red-300' : 'border-gray-300',
              className
            )}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            {...props}
            {...fieldProps}
          />
        </div>
      ) : type === 'date' ? (
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          
          <input
            id={name}
            type="date"
            className={cn(
              "block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-[#0031ac] focus:outline-none focus:ring-1 focus:ring-[#0031ac]",
              icon ? 'pl-10' : '',
              error ? 'border-red-300' : 'border-gray-300',
              className
            )}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
            {...fieldProps}
          />
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}
          
          <input
            id={name}
            type={type}
            className={cn(
              "block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-[#0031ac] focus:outline-none focus:ring-1 focus:ring-[#0031ac]",
              icon ? 'pl-10' : '',
              error ? 'border-red-300' : 'border-gray-300',
              className
            )}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
            {...fieldProps}
          />
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          {errorMessage}
        </p>
      )}
      
      {/* Field hint - only show if there's no error */}
      {props.hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{props.hint}</p>
      )}
    </div>
  );
};

/**
 * FormSection - A container for grouping related form fields
 */
export const FormSection = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={cn("border border-gray-200 rounded-lg p-4 mb-6 bg-white", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

/**
 * FormRow - A row container for horizontal form fields
 */
export const FormRow = ({ children, className = '' }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {children || null}
    </div>
  );
};

FormRow.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

/**
 * Switch - A standardized toggle component
 */
export const Switch = ({
  name,
  label,
  description,
  onChange,
  registerOptions = {},
  ...props
}) => {
  const { register, formState: { errors }, watch } = useFormContext();
  const error = errors[name];
  const checked = watch(name) || false;
  
  const fieldProps = register(name, registerOptions);
  
  return (
    <div className="mb-4">
      <div className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200 gap-3">
        <div className="flex-grow">
          <div className="flex items-center">
            <label htmlFor={name} className="block text-sm font-medium text-gray-800 cursor-pointer">
              {label}
            </label>
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error.message}
            </p>
          )}
        </div>

        <div>
          <label className="relative inline-flex cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              id={name}
              checked={checked}
              onChange={(e) => {
                if (onChange) onChange(e);
              }}
              {...fieldProps}
              {...props}
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Checkbox - A standardized checkbox component
 */
export const Checkbox = ({
  name,
  label,
  description,
  onChange,
  registerOptions = {},
  ...props
}) => {
  const { register, formState: { errors }, watch } = useFormContext();
  const error = errors[name];
  const checked = watch(name) || false;
  
  const fieldProps = register(name, registerOptions);
  
  return (
    <div className="mb-4">
      <div className="flex items-start bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={name}
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={checked}
            onChange={(e) => {
              if (onChange) onChange(e);
            }}
            {...fieldProps}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={name} className="font-medium text-gray-800 cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="text-gray-500 text-xs mt-0.5">{description}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormField; 