#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Tranche {
    Senior = 1,
    Junior = 2,
}

#[contract]
pub struct LendingPool;

const BALANCES: Symbol = symbol_short!("BALANCES");
const TOTAL_SUPPLY: Symbol = symbol_short!("T_SUPPLY");
const RATE: Symbol = symbol_short!("RATE"); // Basis points
const POOL_STATE: Symbol = symbol_short!("STATE"); // 0: Active, 1: Repaid

#[contractimpl]
impl LendingPool {
    // Initialize the pool with a base rate
    pub fn init(env: Env, initial_rate: u32) {
        env.storage().instance().set(&RATE, &initial_rate);
        env.storage().instance().set(&POOL_STATE, &0u32); // Active
    }

    // Deposit funds into the pool
    pub fn deposit(env: Env, from: Address, amount: i128, tranche: Tranche) {
        from.require_auth();

        // Key: (BALANCES, Address, Tranche) - simplified to just Address for this demo
        // but we'll store user's tranche preference if needed.
        let key = (BALANCES, from.clone());
        
        let mut balance = env.storage().persistent().get::<_, i128>(&key).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&key, &balance);

        let mut total = env.storage().instance().get::<_, i128>(&TOTAL_SUPPLY).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&TOTAL_SUPPLY, &total);
    }

    // Withdraw funds (only if pool allows or repaid)
    pub fn withdraw(env: Env, from: Address, amount: i128) {
        from.require_auth();

        let key = (BALANCES, from.clone());
        let mut balance = env.storage().persistent().get::<_, i128>(&key).unwrap_or(0);
        if amount > balance {
            panic!("Insufficient balance");
        }

        balance -= amount;
        env.storage().persistent().set(&key, &balance);

        let mut total = env.storage().instance().get::<_, i128>(&TOTAL_SUPPLY).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&TOTAL_SUPPLY, &total);
    }

    // Set dynamic rate based on risk score (0-100)
    pub fn set_rate(env: Env, risk_score: u32) {
        // Simple logic: Base 5% + (Risk * 0.1)%
        // Risk score 0 (low risk) -> 5%
        // Risk score 100 (high risk) -> 15%
        let base_rate = 500; // 5.00%
        let risk_premium = risk_score * 10; 
        let new_rate = base_rate + risk_premium;
        env.storage().instance().set(&RATE, &new_rate);
    }

    // Get current yield rate
    pub fn get_rate(env: Env) -> u32 {
        env.storage().instance().get(&RATE).unwrap_or(0)
    }

    // Repay the pool (Business pays back)
    pub fn repay(env: Env, from: Address, amount: i128) {
        from.require_auth();
        
        let mut total = env.storage().instance().get::<_, i128>(&TOTAL_SUPPLY).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&TOTAL_SUPPLY, &total);
        
        env.storage().instance().set(&POOL_STATE, &1u32); // Repaid
    }

    // Helper to get total supply
    pub fn get_total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_SUPPLY).unwrap_or(0)
    }
}
