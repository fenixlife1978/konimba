'use server';
/**
 * @fileOverview This file defines a Genkit flow to flag potentially fraudulent payment requests by comparing current statistics to historical records.
 *
 * - flagPotentiallyFraudulentPayments -  The function that initiates the process of flagging potentially fraudulent payment requests.
 * - FlagPotentiallyFraudulentPaymentsInput - The input type for the flagPotentiallyFraudulentPayments function.
 * - FlagPotentiallyFraudulentPaymentsOutput - The output type for the flagPotentiallyFraudulentPayments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagPotentiallyFraudulentPaymentsInputSchema = z.object({
  publisherId: z.string().describe('The ID of the publisher requesting payment.'),
  paymentAmount: z.number().describe('The amount of the current payment request.'),
  paymentCurrency: z.string().describe('The currency of the payment request.'),
  paymentDate: z.string().describe('The date of the payment request.'),
  historicalPaymentData: z.array(z.object({
    paymentAmount: z.number(),
    paymentCurrency: z.string(),
    paymentDate: z.string(),
  })).describe('Historical payment data for the publisher.'),
});
export type FlagPotentiallyFraudulentPaymentsInput = z.infer<typeof FlagPotentiallyFraudulentPaymentsInputSchema>;

const FlagPotentiallyFraudulentPaymentsOutputSchema = z.object({
  isPotentiallyFraudulent: z.boolean().describe('Whether the payment request is potentially fraudulent.'),
  fraudulentReason: z.string().optional().describe('The reason why the payment is potentially fraudulent.'),
});
export type FlagPotentiallyFraudulentPaymentsOutput = z.infer<typeof FlagPotentiallyFraudulentPaymentsOutputSchema>;

export async function flagPotentiallyFraudulentPayments(input: FlagPotentiallyFraudulentPaymentsInput): Promise<FlagPotentiallyFraudulentPaymentsOutput> {
  return flagPotentiallyFraudulentPaymentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flagPotentiallyFraudulentPaymentsPrompt',
  input: {schema: FlagPotentiallyFraudulentPaymentsInputSchema},
  output: {schema: FlagPotentiallyFraudulentPaymentsOutputSchema},
  prompt: `You are an expert in fraud detection for publisher payments.

  You are provided with the following information about a payment request:
  - Publisher ID: {{{publisherId}}}
  - Payment Amount: {{{paymentAmount}}} {{{paymentCurrency}}}
  - Payment Date: {{{paymentDate}}}

  You are also provided with historical payment data for this publisher:
  {{#each historicalPaymentData}}
  - Amount: {{{paymentAmount}}} {{{paymentCurrency}}}, Date: {{{paymentDate}}}
  {{/each}}

  Analyze the current payment request in the context of the historical payment data and determine if the request is potentially fraudulent.
  Consider factors such as:
  - Significant changes in payment amount compared to historical averages.
  - Unusual payment dates or frequencies.
  - Any other anomalies that might indicate fraud.

  Based on your analysis, set the isPotentiallyFraudulent output field to true or false.
  If you set isPotentiallyFraudulent to true, provide a brief reason in the fraudulentReason field.
  If you set isPotentiallyFraudulent to false, leave fraudulentReason empty.
  `,
});

const flagPotentiallyFraudulentPaymentsFlow = ai.defineFlow(
  {
    name: 'flagPotentiallyFraudulentPaymentsFlow',
    inputSchema: FlagPotentiallyFraudulentPaymentsInputSchema,
    outputSchema: FlagPotentiallyFraudulentPaymentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
