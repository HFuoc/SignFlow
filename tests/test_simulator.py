from __future__ import annotations

from app.desktop_collector.domain import Hand, QualityFlag
from app.desktop_collector.sources import DataSource, SimulationConfig, create_simulated_pair


def test_same_seed_produces_same_sensor_sequence() -> None:
    left_a, _ = create_simulated_pair(seed=42, noise_std=9)
    left_b, _ = create_simulated_pair(seed=42, noise_std=9)
    packets_a = [left_a.generate_next(host_timestamp_ns=10_000 + index) for index in range(20)]
    packets_b = [left_b.generate_next(host_timestamp_ns=10_000 + index) for index in range(20)]
    assert packets_a == packets_b


def test_pair_has_independent_identity_hand_sequence_and_timestamp() -> None:
    left, right = create_simulated_pair(seed=7)
    left_packets = [left.generate_next(host_timestamp_ns=100 + i) for i in range(3)]
    right_packets = [right.generate_next(host_timestamp_ns=200 + i) for i in range(2)]
    assert left.descriptor.hand is Hand.LEFT
    assert right.descriptor.hand is Hand.RIGHT
    assert left.descriptor.device_id != right.descriptor.device_id
    assert [packet.sequence_number for packet in left_packets] == [0, 1, 2]
    assert [packet.sequence_number for packet in right_packets] == [0, 1]
    assert left_packets[1].device_timestamp_ms == right_packets[1].device_timestamp_ms
    assert isinstance(left, DataSource)
    assert isinstance(right, DataSource)


def test_every_simulated_packet_is_explicitly_marked() -> None:
    for source in create_simulated_pair():
        for _ in range(10):
            packet = source.generate_next()
            assert packet.simulated is True
            assert packet.quality_flags & QualityFlag.SIMULATED


def test_noise_changes_values_but_remains_reproducible() -> None:
    clean, _ = create_simulated_pair(seed=88, noise_std=0)
    noisy_a, _ = create_simulated_pair(seed=88, noise_std=30)
    noisy_b, _ = create_simulated_pair(seed=88, noise_std=30)
    clean_values = [clean.generate_next(host_timestamp_ns=1).flex_raw for _ in range(10)]
    noisy_values_a = [noisy_a.generate_next(host_timestamp_ns=1).flex_raw for _ in range(10)]
    noisy_values_b = [noisy_b.generate_next(host_timestamp_ns=1).flex_raw for _ in range(10)]
    assert noisy_values_a == noisy_values_b
    assert noisy_values_a != clean_values


def test_config_rejects_invalid_packet_loss() -> None:
    try:
        SimulationConfig(packet_loss_rate=1.0)
    except ValueError as exc:
        assert "packet_loss_rate" in str(exc)
    else:
        raise AssertionError("invalid packet loss was accepted")


def test_packet_loss_creates_observable_sequence_gaps() -> None:
    source, _ = create_simulated_pair(seed=123, sample_rate_hz=500, packet_loss_rate=0.5)
    source.connect()
    try:
        accepted = []
        while len(accepted) < 35:
            packet = source.read_packet(timeout_s=0.2)
            if packet is not None:
                accepted.append(packet)
    finally:
        source.disconnect()
    sequences = [packet.sequence_number for packet in accepted]
    assert any(current > previous + 1 for previous, current in zip(sequences, sequences[1:]))
    assert all(packet.simulated for packet in accepted)
