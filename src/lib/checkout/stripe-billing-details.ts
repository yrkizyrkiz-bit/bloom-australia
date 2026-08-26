/** Billing details to pass into stripe.confirmPayment when Payment Element fields are "never". */
export function stripePaymentMethodBillingDetails(input: {
  name?: string | null;
  email?: string | null;
}): {
  payment_method_data: {
    billing_details: {
      name: string;
      email?: string;
    };
  };
} {
  const email = (input.email ?? "").trim() || undefined;
  const name = (input.name ?? "").trim() || email || "Member";
  return {
    payment_method_data: {
      billing_details: {
        name,
        ...(email ? { email } : {}),
      },
    },
  };
}
