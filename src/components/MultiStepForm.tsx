// "use client"

// import { useState } from "react";
// import { FormProvider, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { AnimatePresence, motion } from "framer-motion";
// import StepCompanyDetails from "./StepCompanyDetails";
// import StepGrantDetails from "./StepGrantDetails";
// import StepAdditionalQuestions from "./StepAdditionalQuestions";
// import StepFinalize from "./StepFinalize";
// import StepBudget from "./StepBudget";
// import { z } from "zod";
// import Finalize from "./StepFinalize";
// import { SimpleStepper } from "./Stepper";



// const stepLabels = [
//   "Company Details",
//   "Grant Details",
//   "Budget",
//   "Additional Questions",
//   "Finalise",
// ];

// const steps = [
//     "Company Details",
//     "Grant Details",
//     "Budget",
//     "Additional Questions",
//     "Finalise",
//   ];
 

// const stepComponents = [
//   StepCompanyDetails,
//   StepGrantDetails,
//   StepBudget,
//   StepAdditionalQuestions,
//   StepFinalize,
// ];

// export const formSchema = z.object({
//     website: z.string().url({ message: "Enter a valid URL" }),
//     abn: z.string().min(9, "ABN must be at least 9 characters"),
//     employees: z.coerce.number().min(1, "Enter number of employees"),
//     background: z.string().min(10, "Provide some background"),
//     uniqueValue: z.string().min(5, "Provide your value proposition"),
//     productStage: z.string().min(5, "Describe the product stage"),
//   });

// export default function MultiStepForm() {
//     const [step, setStep] = useState(0);
//     const [current, setCurrent] = useState(0);
//     const methods = useForm({ resolver: zodResolver(formSchema), mode: "onChange" });
//     const StepPanel = stepComponents[step];

//   return (
//     <FormProvider {...methods}>
//       {/* ← inject tracker here */}
//       {/* <SimpleStepper step={step} labels={stepLabels} /> */}
//       <SimpleStepper steps={steps} currentStep={current} />

//       <form onSubmit={methods.handleSubmit(data => console.log(data))} className="space-y-6">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={step}
//             initial={{ opacity: 0, x: 40 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -40 }}
//             transition={{ duration: 0.3 }}
//           >
//             <StepPanel />
//           </motion.div>
//         </AnimatePresence>

//         <div className="flex justify-between">
//           {step > 0 && (
//             <button
//               type="button"
//               onClick={() => setStep(s => s - 1)}
//               className="px-4 py-2 bg-gray-700 text-white rounded"
//             >
//               Back
//             </button>
//           )}

//           {step < stepComponents.length - 1 ? (
//             <button
//               type="button"
//               onClick={() => setStep(s => s + 1)}
//               className="ml-auto px-4 py-2 bg-blue-600 text-white rounded"
//             >
//               Next
//             </button>
//           ) : (
//             <button
//               type="submit"
//               className="ml-auto px-4 py-2 bg-green-600 text-white rounded"
//             >
//               Submit
//             </button>
//           )}
//         </div>
//       </form>
//     </FormProvider>
//   );
// }
