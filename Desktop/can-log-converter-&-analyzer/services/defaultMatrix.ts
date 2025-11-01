
import type { CanMatrix } from '../types';

// This matrix is derived from the user-provided PDF.
// It serves as the default for decoding uploaded log files.
// Message IDs are stored as decimal strings.
// Assumed big-endian (Motorola) format as it's common and not specified otherwise.

export const defaultMatrix: CanMatrix = {
    "405274497": { // 0X1827FF81
        name: "MCU_IPC_Status",
        dlc: 8,
        signals: {
            "sigOdometer": { name: "sigOdometer", startBit: 32, length: 32, isLittleEndian: false, isSigned: false, scale: 0.1, offset: 0, min: 0, max: 0, unit: "Kms" },
            "sigBatteryFault": { name: "sigBatteryFault", startBit: 0, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryHighTemp": { name: "sigBatteryHighTemp", startBit: 1, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryHighTempCharge": { name: "sigBatteryHighTempCharge", startBit: 2, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryLowTemp": { name: "sigBatteryLowTemp", startBit: 3, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryLowTempCharge": { name: "sigBatteryLowTempCharge", startBit: 4, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryCurrentFault": { name: "sigBatteryCurrentFault", startBit: 5, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryOverVoltage": { name: "sigBatteryOverVoltage", startBit: 6, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBatteryLowVoltage": { name: "sigBatteryLowVoltage", startBit: 7, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
        }
    },
    "272170832": { // 0X1038FF50
        name: "Battery_MCU_Status",
        dlc: 8,
        signals: {
             "sigBatteryCurrentFault2": { name: "sigBatteryCurrentFault2", startBit: 8, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigOutputVoltageFault": { name: "sigOutputVoltageFault", startBit: 9, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigBatteryInternalFault": { name: "sigBatteryInternalFault", startBit: 10, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigPositiveBusInsulation": { name: "sigPositiveBusInsulation", startBit: 11, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigNegativeBusInsulation": { name: "sigNegativeBusInsulation", startBit: 12, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigPositiveBusAdhesion": { name: "sigPositiveBusAdhesion", startBit: 13, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigNegativeBusAdhesion": { name: "sigNegativeBusAdhesion", startBit: 14, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigLowSOCDischarge1": { name: "sigLowSOCDischarge1", startBit: 15, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigLowSOCDischarge2": { name: "sigLowSOCDischarge2", startBit: 16, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigPermanentFault1": { name: "sigPermanentFault1", startBit: 17, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigPermanentFault2": { name: "sigPermanentFault2", startBit: 18, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
             "sigTCUCommFault": { name: "sigTCUCommFault", startBit: 19, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
        }
    },
    "405819456": { // 0X18305040
        name: "MCU_IPC_Faults",
        dlc: 8,
        signals: {
            "sigControllerFault1": { name: "sigControllerFault1", startBit: 0, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigControllerFault2": { name: "sigControllerFault2", startBit: 1, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigCurrentSensorFault": { name: "sigCurrentSensorFault", startBit: 2, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigPrechargeFault": { name: "sigPrechargeFault", startBit: 3, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigControllerFault3": { name: "sigControllerFault3", startBit: 4, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigControllerFault4": { name: "sigControllerFault4", startBit: 5, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigSevereBPlus": { name: "sigSevereBPlus", startBit: 6, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigSevereKSI": { name: "sigSevereKSI", startBit: 7, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigSevereBPlus2": { name: "sigSevereBPlus2", startBit: 8, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigSevereKSI2": { name: "sigSevereKSI2", startBit: 9, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigControllerFault5": { name: "sigControllerFault5", startBit: 10, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBUndervoltage": { name: "sigBUndervoltage", startBit: 11, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBOvervoltage": { name: "sigBOvervoltage", startBit: 12, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sig5VSupply": { name: "sig5VSupply", startBit: 13, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMotorTemp1": { name: "sigMotorTemp1", startBit: 14, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMotorTemp2": { name: "sigMotorTemp2", startBit: 15, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMainContactor": { name: "sigMainContactor", startBit: 16, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigSinCosSensor": { name: "sigSinCosSensor", startBit: 17, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMotorPhase": { name: "sigMotorPhase", startBit: 18, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMainContactorWeld": { name: "sigMainContactorWeld", startBit: 19, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMainContactorNotClosing": { name: "sigMainContactorNotClosing", startBit: 20, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigThrottleWiper1": { name: "sigThrottleWiper1", startBit: 21, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigThrottleWiper2": { name: "sigThrottleWiper2", startBit: 22, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigEEPROMFault": { name: "sigEEPROMFault", startBit: 23, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigVCLRunTime": { name: "sigVCLRunTime", startBit: 24, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigMotorCharacterization": { name: "sigMotorCharacterization", startBit: 25, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigEncoderPulse": { name: "sigEncoderPulse", startBit: 26, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigEncoderLOS": { name: "sigEncoderLOS", startBit: 27, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBrakeWiper1": { name: "sigBrakeWiper1", startBit: 28, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigBrakeWiper2": { name: "sigBrakeWiper2", startBit: 29, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
            "sigHighPedal": { name: "sigHighPedal", startBit: 30, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
        }
    },
    "271061072": { // 0X10281050
        name: "Battery_IPC_Info",
        dlc: 8,
        signals: {
            "sigStateOfCharge": { name: "sigStateOfCharge", startBit: 0, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 100, unit: "%" },
            "sigDistanceToEmpty": { name: "sigDistanceToEmpty", startBit: 8, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 255, unit: "Km" },
            "sigTimeToCharge": { name: "sigTimeToCharge", startBit: 16, length: 8, isLittleEndian: false, isSigned: false, scale: 3, offset: 0, min: 0, max: 765, unit: "Min" },
            "sigBatteryTemp": { name: "sigBatteryTemp", startBit: 24, length: 8, isLittleEndian: false, isSigned: true, scale: 1, offset: 0, min: -128, max: 127, unit: "degC" },
            "sigKeyOnIndicator": { name: "sigKeyOnIndicator", startBit: 34, length: 2, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 3, unit: "" },
            "sigBatteryFaultIndicator": { name: "sigBatteryFaultIndicator", startBit: 36, length: 2, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 3, unit: "" },
            "sigBatterySwap": { name: "sigBatterySwap", startBit: 38, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
        }
    },
    "419365728": { // 0X18FF0360
        name: "Battery_Status_TPDO3",
        dlc: 8,
        signals: {
            "sigBatteryState": { name: "sigBatteryState", startBit: 56, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 5, unit: "" },
        }
    },
    "337854544": { // 0X14234050
        name: "Battery_MCU_Current",
        dlc: 8,
        signals: {
            "sigBatteryCurrent": { name: "sigBatteryCurrent", startBit: 0, length: 16, isLittleEndian: false, isSigned: true, scale: 0.1, offset: 0, min: -250, max: 250, unit: "A" },
            "sigDriveCurrentLimit": { name: "sigDriveCurrentLimit", startBit: 16, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 255, unit: "" },
            "sigRegenCurrentLimit": { name: "sigRegenCurrentLimit", startBit: 24, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 255, unit: "" },
        }
    },
    "338624400": { // 0X142EFF90
        name: "Battery_IPC_Capacity",
        dlc: 8,
        signals: {
            "sigBatteryCurrent2": { name: "sigBatteryCurrent2", startBit: 0, length: 16, isLittleEndian: false, isSigned: true, scale: 0.1, offset: 0, min: -250, max: 250, unit: "A" },
            "sigAmpereHours": { name: "sigAmpereHours", startBit: 16, length: 16, isLittleEndian: false, isSigned: true, scale: 0.01, offset: 0, min: 0, max: 0, unit: "Ahr" },
            "sigKilowattHours": { name: "sigKilowattHours", startBit: 32, length: 16, isLittleEndian: false, isSigned: true, scale: 0.01, offset: 0, min: 0, max: 0, unit: "kWhr" },
            "sigBatteryPackVoltage": { name: "sigBatteryPackVoltage", startBit: 48, length: 16, isLittleEndian: false, isSigned: false, scale: 0.01, offset: 0, min: 0, max: 0, unit: "Volt" },
        }
    },
    "337920080": { // 0X14244050
        name: "Battery_MCU_CellVoltage",
        dlc: 8,
        signals: {
            "sigMinCellVoltage": { name: "sigMinCellVoltage", startBit: 0, length: 16, isLittleEndian: false, isSigned: false, scale: 0.001, offset: 0, min: 0, max: 0, unit: "Volt" },
            "sigMaxCellVoltage": { name: "sigMaxCellVoltage", startBit: 32, length: 16, isLittleEndian: false, isSigned: false, scale: 0.001, offset: 0, min: 0, max: 0, unit: "Volt" },
        }
    },
    "405164096": { // 0X18265040
        name: "MCU_IPC_ControllerInfo",
        dlc: 8,
        signals: {
            "sigControllerTemp": { name: "sigControllerTemp", startBit: 0, length: 8, isLittleEndian: false, isSigned: true, scale: 1, offset: 0, min: -40, max: 215, unit: "DegC" },
            "sigMotorTemp": { name: "sigMotorTemp", startBit: 8, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: -50, min: -50, max: 205, unit: "DegC" },
        }
    },
    "405229632": { // 0X18275040
        name: "MCU_IPC_VehicleInfo",
        dlc: 8,
        signals: {
            "sigCapacitorVoltage": { name: "sigCapacitorVoltage", startBit: 16, length: 16, isLittleEndian: false, isSigned: false, scale: 0.1, offset: 0, min: 0, max: 0, unit: "Volt" },
            "sigSpeed": { name: "sigSpeed", startBit: 48, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 100, unit: "Kmph" },
        }
    },
    "405208961": { // 0X1826FF81
        name: "MCU_IPC_ModeInfo",
        dlc: 8,
        signals: {
             "sigVehicleMode": { name: "sigVehicleMode", startBit: 32, length: 3, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 7, unit: "" },
             "sigDriveMode": { name: "sigDriveMode", startBit: 56, length: 3, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 7, unit: "" },
             "sigRegenFlag": { name: "sigRegenFlag", startBit: 59, length: 1, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 1, unit: "" },
        }
    },
    "1536": { // 0x600 - Example for user-provided log format
        name: "MCU_IPC_VehicleInfo_Example",
        dlc: 8,
        signals: {
            "sigCapacitorVoltage": { name: "sigCapacitorVoltage", startBit: 16, length: 16, isLittleEndian: false, isSigned: false, scale: 0.1, offset: 0, min: 0, max: 0, unit: "Volt" },
            "sigSpeed": { name: "sigSpeed", startBit: 48, length: 8, isLittleEndian: false, isSigned: false, scale: 1, offset: 0, min: 0, max: 100, unit: "Kmph" },
        }
    }
};
